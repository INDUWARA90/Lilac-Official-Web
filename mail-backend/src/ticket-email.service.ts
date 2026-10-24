import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import nodemailer, { type Transporter } from "nodemailer";
import QRCode from "qrcode";

type Purchase = { id: string; name: string; email: string; reference: string };
type Delivery = Purchase & { deliveryId: string };
type Ticket = { token: string; seat_label: string };

@Injectable()
export class TicketEmailService {
  private readonly db: SupabaseClient;
  private readonly delayMs: number;

  constructor(private readonly config: ConfigService) {
    this.db = createClient(this.required("SUPABASE_URL"), this.required("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });
    this.delayMs = this.number("SMTP_DELAY_MS", 250);
  }

  /** Called immediately by the website after one payment becomes approved. */
  async sendForApprovedPurchase(purchaseId: string): Promise<{ sent: boolean; status: string }> {
    const purchase = await this.approvedPurchase(purchaseId);
    if (!purchase) throw new Error("Purchase is not approved or does not exist.");
    await this.enqueue(purchase.id);
    return this.sendOne(purchase.id);
  }

  /** Catch-up command: finds every approved purchase without a sent email. */
  async sendMissingApprovedEmails(): Promise<{ checked: number; sent: number; failed: number; alreadySent: number }> {
    await this.releaseStaleClaims();
    const purchases = await this.allApprovedPurchases();
    let sent = 0, failed = 0, alreadySent = 0;
    for (const purchase of purchases) {
      await this.enqueue(purchase.id);
      const result = await this.sendOne(purchase.id);
      if (result.status === "sent" && result.sent) sent += 1;
      else if (result.status === "sent") alreadySent += 1;
      else failed += 1;
      if (this.delayMs) await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }
    return { checked: purchases.length, sent, failed, alreadySent };
  }

  private async sendOne(purchaseId: string): Promise<{ sent: boolean; status: string }> {
    const delivery = await this.claim(purchaseId);
    if (!delivery) {
      const { data } = await this.db.from("ticket_email_deliveries").select("status").eq("purchase_id", purchaseId).maybeSingle();
      return { sent: false, status: data?.status ?? "missing" };
    }
    try {
      const info = await this.transporter().sendMail({
        from: { name: this.config.get<string>("SMTP_FROM_NAME") || "Lilac", address: this.required("SMTP_FROM_EMAIL") },
        to: { name: delivery.name, address: delivery.email },
        subject: this.required("EMAIL_SUBJECT"), text: this.message(delivery),
        attachments: await this.ticketAttachments(delivery.id),
      });
      await this.finish(delivery.deliveryId, "sent", info.messageId);
      return { sent: true, status: "sent" };
    } catch (error) {
      await this.finish(delivery.deliveryId, "failed", error instanceof Error ? error.message : "SMTP send failed");
      return { sent: false, status: "failed" };
    }
  }

  private async enqueue(purchaseId: string): Promise<void> {
    const { error } = await this.db.from("ticket_email_deliveries").upsert({ purchase_id: purchaseId }, { onConflict: "purchase_id", ignoreDuplicates: true });
    if (error) throw new Error(`Could not queue email: ${error.message}`);
  }
  private async claim(purchaseId: string): Promise<Delivery | null> {
    // `sent` is never claimed again. Failed sends are retried by the catch-up command.
    const { data: row, error } = await this.db.from("ticket_email_deliveries").select("id, status, attempts").eq("purchase_id", purchaseId).maybeSingle();
    if (error || !row) throw new Error(`Could not read delivery: ${error?.message ?? "missing"}`);
    if (row.status === "sent" || row.status === "sending") return null;
    const { data, error: updateError } = await this.db.from("ticket_email_deliveries").update({ status: "sending", locked_at: new Date().toISOString(), attempts: row.attempts + 1, updated_at: new Date().toISOString() }).eq("id", row.id).eq("status", row.status).select("id").maybeSingle();
    if (updateError || !data) return null;
    const purchase = await this.approvedPurchase(purchaseId);
    if (!purchase) throw new Error("Purchase stopped being approved.");
    return { ...purchase, deliveryId: row.id };
  }
  private async finish(id: string, status: "sent" | "failed", detail: string): Promise<void> {
    const { error } = await this.db.from("ticket_email_deliveries").update({ status, locked_at: null, sent_at: status === "sent" ? new Date().toISOString() : null, provider_message_id: status === "sent" ? detail.slice(0, 500) : null, last_error: status === "failed" ? detail.slice(0, 500) : null, updated_at: new Date().toISOString() }).eq("id", id).eq("status", "sending");
    if (error) throw new Error(`Could not save email status: ${error.message}`);
  }
  private async releaseStaleClaims(): Promise<void> {
    const staleBefore = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { error } = await this.db.from("ticket_email_deliveries").update({ status: "failed", locked_at: null, last_error: "Interrupted send; retry required", updated_at: new Date().toISOString() }).eq("status", "sending").lt("locked_at", staleBefore);
    if (error) throw new Error(`Could not recover interrupted emails: ${error.message}`);
  }
  private async approvedPurchase(id: string): Promise<Purchase | null> {
    const { data, error } = await this.db.from("ticket_purchases").select("id, name, email, reference").eq("id", id).eq("status", "approved").maybeSingle();
    if (error) throw new Error(`Could not load purchase: ${error.message}`);
    return data as Purchase | null;
  }
  private async allApprovedPurchases(): Promise<Purchase[]> {
    const { data, error } = await this.db.from("ticket_purchases").select("id, name, email, reference").eq("status", "approved").order("id");
    if (error) throw new Error(`Could not load approved purchases: ${error.message}`);
    return (data ?? []) as Purchase[];
  }
  private async ticketAttachments(purchaseId: string) {
    const { data, error } = await this.db.from("tickets").select("token, seat_label").eq("purchase_id", purchaseId).order("seat_label");
    if (error) throw new Error(`Could not load issued tickets: ${error.message}`);
    const tickets = (data ?? []) as Ticket[];
    if (!tickets.length) throw new Error("No issued tickets found for this approved purchase.");
    return Promise.all(tickets.map(async (ticket, index) => ({
      filename: `lilac-entry-pass-${index + 1}.png`,
      contentType: "image/png",
      content: await QRCode.toBuffer(this.checkinUrl(ticket.token), { width: 768, margin: 2 }),
      contentDisposition: "attachment" as const,
    })));
  }
  private checkinUrl(token: string): string { return `${this.required("PUBLIC_SITE_URL").replace(/\/$/, "")}/checkin/t/${token}`; }
  private transporter(): Transporter { return nodemailer.createTransport({ host: this.required("SMTP_HOST"), port: this.number("SMTP_PORT", 587), secure: this.config.get<string>("SMTP_SECURE") === "true", auth: { user: this.required("SMTP_USER"), pass: this.required("SMTP_PASSWORD") } }); }
  private message(p: Purchase): string { return this.required("EMAIL_TEXT_TEMPLATE").replace(/\\n/g, "\n").replaceAll("{{name}}", p.name).replaceAll("{{email}}", p.email).replaceAll("{{reference}}", p.reference); }
  private required(name: string): string { const value = this.config.get<string>(name)?.trim(); if (!value) throw new Error(`${name} is required.`); return value; }
  private number(name: string, fallback: number): number { const value = this.config.get<string>(name); if (!value) return fallback; const n = Number(value); if (!Number.isInteger(n) || n < 0) throw new Error(`${name} must be a positive number.`); return n; }
}
