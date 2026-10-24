import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import * as nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import * as QRCode from "qrcode";
import sharp = require("sharp");

type Purchase = { id: string; name: string; email: string; reference: string; registration_number: string; faculty: string };
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

  /** Sends one database-independent sample pass through the real attachment renderer. */
  async sendTestPass(recipient: string): Promise<string> {
    const sample: Purchase = {
      id: "test-purchase",
      name: "Lilac Test Attendee",
      email: recipient,
      reference: "TEST-PASS-ONLY",
      registration_number: "TEST/2026/001",
      faculty: "Faculty of Technology",
    };
    const attachment = await this.ticketAttachment(sample, { token: "test-pass-not-valid", seat_label: "Seating test pass" }, 0);
    const info = await this.transporter().sendMail({
      from: { name: this.config.get<string>("SMTP_FROM_NAME") || "Lilac", address: this.required("SMTP_FROM_EMAIL") },
      to: { name: sample.name, address: recipient },
      subject: "Lilac full ticket attachment test — not valid for entry",
      text: "This is a sample of the full ticket attachment. It is not valid for entry and was not added to the ticket email queue.",
      attachments: [attachment],
    });
    return info.messageId;
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
        attachments: await this.ticketAttachments(delivery),
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
    const { data, error } = await this.db.from("ticket_purchases").select("id, name, email, reference, registration_number, faculty").eq("id", id).eq("status", "approved").maybeSingle();
    if (error) throw new Error(`Could not load purchase: ${error.message}`);
    return data as Purchase | null;
  }
  private async allApprovedPurchases(): Promise<Purchase[]> {
    const { data, error } = await this.db.from("ticket_purchases").select("id, name, email, reference, registration_number, faculty").eq("status", "approved").order("id");
    if (error) throw new Error(`Could not load approved purchases: ${error.message}`);
    return (data ?? []) as Purchase[];
  }
  private async ticketAttachments(purchase: Purchase) {
    const { data, error } = await this.db.from("tickets").select("token, seat_label").eq("purchase_id", purchase.id).order("seat_label");
    if (error) throw new Error(`Could not load issued tickets: ${error.message}`);
    const tickets = (data ?? []) as Ticket[];
    if (!tickets.length) throw new Error("No issued tickets found for this approved purchase.");
    return Promise.all(tickets.map((ticket, index) => this.ticketAttachment(purchase, ticket, index)));
  }
  private async ticketAttachment(purchase: Purchase, ticket: Ticket, index: number) {
    return {
      filename: `lilac-entry-pass-${ticket.seat_label.replace(/[^a-z0-9]+/gi, "-").replace(/(^-|-$)/g, "").toLowerCase() || index + 1}.png`,
      contentType: "image/png",
      content: await this.renderTicketPass(purchase, ticket),
      contentDisposition: "attachment" as const,
    };
  }
  private async renderTicketPass(purchase: Purchase, ticket: Ticket): Promise<Buffer> {
    const qr = await QRCode.toDataURL(this.checkinUrl(ticket.token), { width: 720, margin: 2 });
    const e = (value: string) => value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&apos;", '"': "&quot;" })[character] ?? character);
    const svg = `<svg width="1200" height="1800" viewBox="0 0 1200 1800" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="1800" fill="#f8f5fc"/>
      <rect x="50" y="50" width="1100" height="1700" rx="36" fill="#fff" stroke="#e2d9ec" stroke-width="3"/>
      <path d="M86 50H1114V450H86Z" fill="#7b539f"/>
      <circle cx="1080" cy="100" r="220" fill="#cbb0e9" opacity=".55"/>
      <text x="600" y="130" text-anchor="middle" fill="#f3d98a" font-family="Arial, sans-serif" font-size="28" font-weight="700">LILAC LIVE IN CONCERT</text>
      <text x="600" y="230" text-anchor="middle" fill="#fff" font-family="Georgia, serif" font-size="66" font-weight="700">${e(ticket.seat_label)}</text>
      <text x="600" y="305" text-anchor="middle" fill="#fff" font-family="Arial, sans-serif" font-size="31" font-weight="700">Holder: ${e(purchase.name)}</text>
      <text x="600" y="355" text-anchor="middle" fill="#f7efff" font-family="monospace" font-size="24" font-weight="700">REF: ${e(purchase.reference)}</text>
      <line x1="90" y1="480" x2="1110" y2="480" stroke="#e8e1ef" stroke-width="3" stroke-dasharray="14 14"/>
      <rect x="278" y="532" width="644" height="644" rx="28" fill="#fff" stroke="#f0ebf5" stroke-width="3"/>
      <image href="${qr}" x="310" y="564" width="580" height="580"/>
      <text x="600" y="1270" text-anchor="middle" fill="#2e2437" font-family="Arial, sans-serif" font-size="34" font-weight="700">${e(purchase.name)}</text>
      <text x="600" y="1315" text-anchor="middle" fill="#7b539f" font-family="Arial, sans-serif" font-size="28" font-weight="700">${e(purchase.faculty || "Faculty not provided")}</text>
      <text x="600" y="1360" text-anchor="middle" fill="#5d3a85" font-family="monospace" font-size="26" font-weight="700">REG NO: ${e(purchase.registration_number || "Not provided")}</text>
      <text x="600" y="1410" text-anchor="middle" fill="#5d3a85" font-family="monospace" font-size="32" font-weight="700">ENTRY REF: ${e(purchase.reference)}</text>
      <text x="600" y="1475" text-anchor="middle" fill="#8a7b96" font-family="Arial, sans-serif" font-size="24">Please present this QR code clearly at the entrance gate.</text>
      <text x="600" y="1515" text-anchor="middle" fill="#8a7b96" font-family="Arial, sans-serif" font-size="24">Valid for single admission. Non-transferable.</text>
    </svg>`;
    return (sharp as unknown as typeof import("sharp").default)(Buffer.from(svg)).png().toBuffer();
  }
  private checkinUrl(token: string): string { return `${this.required("PUBLIC_SITE_URL").replace(/\/$/, "")}/checkin/t/${token}`; }
  private transporter(): Transporter { return nodemailer.createTransport({ host: this.required("SMTP_HOST"), port: this.number("SMTP_PORT", 587), secure: this.config.get<string>("SMTP_SECURE") === "true", auth: { user: this.required("SMTP_USER"), pass: this.required("SMTP_PASSWORD") } }); }
  private message(p: Purchase): string { return this.required("EMAIL_TEXT_TEMPLATE").replace(/\\n/g, "\n").replaceAll("{{name}}", p.name).replaceAll("{{email}}", p.email).replaceAll("{{reference}}", p.reference); }
  private required(name: string): string { const value = this.config.get<string>(name)?.trim(); if (!value) throw new Error(`${name} is required.`); return value; }
  private number(name: string, fallback: number): number { const value = this.config.get<string>(name); if (!value) return fallback; const n = Number(value); if (!Number.isInteger(n) || n < 0) throw new Error(`${name} must be a positive number.`); return n; }
}
