import "server-only";
import { randomBytes, randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import QRCode from "qrcode";
import { createAdminClient } from "@/lib/supabase/admin";
import { publicEnv } from "@/lib/env";
import { logAudit } from "@/lib/audit";
import {
  sendAdminAlert,
  sendTicketApproved,
  sendTicketPending,
  sendTicketRejected,
} from "@/lib/email/resend";
import {
  TICKET_SLIP_BUCKET,
  type TicketAvailability,
  type TicketSettings,
} from "@/lib/tickets-shared";
import type { TicketRow, TicketSettingsRow } from "@/lib/supabase/types";

// ---- ids ------------------------------------------------------------------

const REF_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // no I L O U

/** Human-readable purchase reference, e.g. LILAC-7K2M9. */
function newReference(): string {
  let s = "";
  for (let i = 0; i < 6; i++) s += REF_ALPHABET[randomInt(REF_ALPHABET.length)];
  return `LILAC-${s}`;
}

/** Opaque per-ticket token that goes in the QR code (128 bits). */
function newToken(): string {
  return randomBytes(24).toString("base64url");
}

export function ticketUrl(token: string): string {
  return `${publicEnv.siteUrl}/ticket/${token}`;
}

/** The URL door staff land on after scanning the QR. */
export function checkinUrl(token: string): string {
  return `${publicEnv.siteUrl}/checkin/t/${token}`;
}

// ---- settings + availability --------------------------------------------

export async function getTicketSettings(): Promise<TicketSettings> {
  const { data } = await createAdminClient()
    .from("ticket_settings")
    .select("*")
    .eq("id", "default")
    .maybeSingle();

  return {
    priceLkr: data?.price_lkr ?? 500,
    capacity: data?.capacity ?? 100,
    salesOpen: data?.sales_open ?? true,
    bankName: data?.bank_name ?? "",
    bankAccountName: data?.bank_account_name ?? "",
    bankAccountNumber: data?.bank_account_number ?? "",
    bankBranch: data?.bank_branch ?? "",
    bankInstructions: data?.bank_instructions ?? "",
  };
}

export async function getAvailability(): Promise<TicketAvailability> {
  const db = createAdminClient();
  const [{ data: settings }, { data: live }] = await Promise.all([
    db.from("ticket_settings").select("capacity, sales_open").eq("id", "default").maybeSingle(),
    db.from("ticket_purchases").select("quantity").in("status", ["pending_review", "approved"]),
  ]);

  const capacity = settings?.capacity ?? 100;
  const taken = (live ?? []).reduce((n, r) => n + (r.quantity ?? 0), 0);
  return {
    capacity,
    taken,
    left: Math.max(0, capacity - taken),
    salesOpen: settings?.sales_open ?? true,
  };
}

export async function updateTicketSettings(
  patch: Partial<TicketSettings>,
  by: string,
): Promise<boolean> {
  const row: Partial<TicketSettingsRow> = {
    updated_at: new Date().toISOString(),
    updated_by: by,
  };
  if (patch.priceLkr !== undefined) row.price_lkr = patch.priceLkr;
  if (patch.capacity !== undefined) row.capacity = patch.capacity;
  if (patch.salesOpen !== undefined) row.sales_open = patch.salesOpen;
  if (patch.bankName !== undefined) row.bank_name = patch.bankName;
  if (patch.bankAccountName !== undefined) row.bank_account_name = patch.bankAccountName;
  if (patch.bankAccountNumber !== undefined) row.bank_account_number = patch.bankAccountNumber;
  if (patch.bankBranch !== undefined) row.bank_branch = patch.bankBranch;
  if (patch.bankInstructions !== undefined) row.bank_instructions = patch.bankInstructions;

  const { error } = await createAdminClient()
    .from("ticket_settings")
    .update(row)
    .eq("id", "default");
  if (!error) {
    await logAudit("ticket.settings", { fields: Object.keys(row), by }, null);
    revalidatePath("/tickets"); // price/capacity/sales-open changed — see app/tickets/page.tsx (ISR)
  }
  return !error;
}

// ---- purchase -----------------------------------------------------------

type CreateResult =
  | { ok: true; reference: string }
  | { ok: false; error: string; soldOut?: boolean };

export async function createPurchase(input: {
  name: string;
  email: string;
  phone: string;
  quantity: number;
  slipPath: string;
}): Promise<CreateResult> {
  const db = createAdminClient();

  // Confirm the uploaded slip actually exists in the private bucket.
  const { data: exists } = await db.storage
    .from(TICKET_SLIP_BUCKET)
    .list("", { search: input.slipPath });
  if (!exists?.some((o) => o.name === input.slipPath)) {
    return { ok: false, error: "Your bank slip upload wasn't found. Please attach it again." };
  }

  const reference = newReference();
  const { error } = await db.rpc("create_ticket_purchase", {
    p_name: input.name,
    p_email: input.email,
    p_phone: input.phone,
    p_quantity: input.quantity,
    p_slip_path: input.slipPath,
    p_reference: reference,
  });

  if (error) {
    const m = error.message || "";
    if (m.includes("SOLD_OUT")) {
      return { ok: false, error: "Sorry — those tickets just sold out.", soldOut: true };
    }
    if (m.includes("SALES_CLOSED")) {
      return { ok: false, error: "Ticket sales are closed.", soldOut: true };
    }
    if (error.code === "23505") {
      return {
        ok: false,
        error: "There's already a ticket purchase for this email or phone number.",
      };
    }
    console.error(`create_ticket_purchase failed: ${error.code ?? "unknown"}`);
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  revalidatePath("/tickets"); // seats just got taken — see app/tickets/page.tsx (ISR)
  const settings = await getTicketSettings();

  // Acknowledgement to the buyer's own email address.
  const buyerEmail = await sendTicketPending({
    to: input.email,
    name: input.name,
    reference,
    quantity: input.quantity,
    amountLkr: input.quantity * settings.priceLkr,
  }).catch((): { ok: false; reason: string } => ({ ok: false, reason: "threw" }));

  if (!buyerEmail.ok) {
    console.error(`ticket pending email to buyer failed: ${buyerEmail.reason ?? "unknown"}`);
  }

  await sendAdminAlert(
    "New ticket purchase to review",
    `${input.name} <${input.email}> requested ${input.quantity} ticket(s).\n` +
      `Reference: ${reference}\n` +
      (buyerEmail.ok
        ? "The buyer was emailed a confirmation."
        : `⚠ Could not email the buyer (${buyerEmail.reason}). Contact them directly.`) +
      `\nReview: ${publicEnv.siteUrl}/admin/tickets`,
  ).catch(() => {});

  return { ok: true, reference };
}

// ---- admin review ------------------------------------------------------

export async function approvePurchase(
  purchaseId: string,
  by: string,
): Promise<{ ok: boolean; error?: string; emailSent?: boolean }> {
  const db = createAdminClient();

  const { data: purchase } = await db
    .from("ticket_purchases")
    .select("*")
    .eq("id", purchaseId)
    .maybeSingle();
  if (!purchase) return { ok: false, error: "Purchase not found." };
  if (purchase.status === "approved") return { ok: true };
  if (purchase.status !== "pending_review") {
    return { ok: false, error: `This purchase is ${purchase.status}.` };
  }

  const rows = Array.from({ length: purchase.quantity }, (_, i) => ({
    purchase_id: purchase.id,
    token: newToken(),
    seat_label:
      purchase.quantity === 1 ? "Admission" : `Admission ${i + 1} of ${purchase.quantity}`,
    holder_name: purchase.name,
  }));

  const { data: created, error: insErr } = await db.from("tickets").insert(rows).select("*");
  if (insErr || !created) {
    console.error("approvePurchase: ticket insert failed");
    return { ok: false, error: "Could not issue the tickets. Try again." };
  }

  const { error: updErr } = await db
    .from("ticket_purchases")
    .update({
      status: "approved",
      reviewed_by: by,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", purchase.id);
  if (updErr) {
    await db.from("tickets").delete().eq("purchase_id", purchase.id);
    return { ok: false, error: "Could not finalise the purchase. Try again." };
  }

  await logAudit(
    "ticket.approve",
    { purchase_id: purchase.id, reference: purchase.reference, seats: created.length, by },
    null,
  );

  // E-ticket email with a QR per seat.
  const attachments = await Promise.all(
    created.map(async (t, i) => ({
      filename: `lilac-ticket-${i + 1}.png`,
      content: (
        await QRCode.toBuffer(checkinUrl(t.token), { width: 512, margin: 1 })
      ).toString("base64"),
      contentType: "image/png",
      contentId: `qr-${i}`,
    })),
  );
  const sent = await sendTicketApproved({
    to: purchase.email,
    name: purchase.name,
    reference: purchase.reference,
    tickets: created.map((t) => ({ seatLabel: t.seat_label, url: ticketUrl(t.token) })),
    attachments,
  }).catch((): { ok: false; reason: string } => ({ ok: false, reason: "threw" }));

  if (!sent.ok) {
    console.error(`e-ticket email failed for ${purchase.reference}: ${sent.reason ?? "unknown"}`);
    await sendAdminAlert(
      "E-ticket email failed",
      `Approved ${purchase.reference} for ${purchase.name} <${purchase.email}> but the e-ticket ` +
        `email did not send (${sent.reason}). Send the ticket link(s) manually:\n` +
        created.map((t) => `${t.seat_label}: ${ticketUrl(t.token)}`).join("\n"),
    ).catch(() => {});
  }

  return { ok: true, emailSent: sent.ok };
}

export async function rejectPurchase(
  purchaseId: string,
  by: string,
  note: string,
): Promise<{ ok: boolean; error?: string }> {
  const db = createAdminClient();
  const { data: purchase } = await db
    .from("ticket_purchases")
    .select("*")
    .eq("id", purchaseId)
    .maybeSingle();
  if (!purchase) return { ok: false, error: "Purchase not found." };
  if (purchase.status === "approved") {
    return { ok: false, error: "This purchase is already approved — reverse it another way." };
  }

  const { error } = await db
    .from("ticket_purchases")
    .update({
      status: "rejected",
      review_note: note || null,
      reviewed_by: by,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", purchase.id);
  if (error) return { ok: false, error: "Could not update the purchase." };

  revalidatePath("/tickets"); // rejecting frees up the seat(s) it held — see app/tickets/page.tsx (ISR)
  await logAudit(
    "ticket.reject",
    { purchase_id: purchase.id, reference: purchase.reference, by },
    null,
  );
  await sendTicketRejected({
    to: purchase.email,
    name: purchase.name,
    reference: purchase.reference,
    reason: note || "We could not match your bank transfer.",
  }).catch(() => {});

  return { ok: true };
}

// ---- check-in ---------------------------------------------------------

export type CheckInLookup = {
  ticket: TicketRow;
  purchaseReference: string;
  purchaseStatus: string;
};

export async function getTicketByToken(token: string): Promise<CheckInLookup | null> {
  const db = createAdminClient();
  const { data: ticket } = await db.from("tickets").select("*").eq("token", token).maybeSingle();
  if (!ticket) return null;
  const { data: purchase } = await db
    .from("ticket_purchases")
    .select("reference, status")
    .eq("id", ticket.purchase_id)
    .maybeSingle();
  return {
    ticket,
    purchaseReference: purchase?.reference ?? "",
    purchaseStatus: purchase?.status ?? "unknown",
  };
}

export async function checkInTicket(
  token: string,
  by: string,
): Promise<{ ok: boolean; error?: string; alreadyAt?: string }> {
  const db = createAdminClient();
  const { data: ticket } = await db.from("tickets").select("*").eq("token", token).maybeSingle();
  if (!ticket) return { ok: false, error: "Ticket not found." };
  if (ticket.checked_in_at) {
    return { ok: false, error: "Already checked in.", alreadyAt: ticket.checked_in_at };
  }

  const { error } = await db
    .from("tickets")
    .update({ checked_in_at: new Date().toISOString(), checked_in_by: by })
    .eq("id", ticket.id)
    .is("checked_in_at", null); // guard against a double-scan race
  if (error) return { ok: false, error: "Could not check in. Try again." };

  await logAudit("ticket.checkin", { ticket_id: ticket.id, by }, null);
  return { ok: true };
}

export async function undoCheckIn(
  token: string,
  by: string,
): Promise<{ ok: boolean; error?: string }> {
  const db = createAdminClient();
  const { data: ticket } = await db.from("tickets").select("id").eq("token", token).maybeSingle();
  if (!ticket) return { ok: false, error: "Ticket not found." };
  const { error } = await db
    .from("tickets")
    .update({ checked_in_at: null, checked_in_by: null })
    .eq("id", ticket.id);
  if (error) return { ok: false, error: "Could not update the ticket." };
  await logAudit("ticket.checkin_undo", { ticket_id: ticket.id, by }, null);
  return { ok: true };
}

// ---- slips -----------------------------------------------------------

export async function slipDownloadUrl(path: string): Promise<string | null> {
  const { data } = await createAdminClient()
    .storage.from(TICKET_SLIP_BUCKET)
    .createSignedUrl(path, 60 * 10);
  return data?.signedUrl ?? null;
}

export async function qrDataUrl(token: string): Promise<string> {
  return QRCode.toDataURL(checkinUrl(token), { width: 320, margin: 1 });
}
