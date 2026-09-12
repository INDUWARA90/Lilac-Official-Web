import "server-only";
import { randomBytes, randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import QRCode from "qrcode";
import { createAdminClient } from "@/lib/supabase/admin";
import { publicEnv } from "@/lib/env";
import { logAudit } from "@/lib/audit";
import { normalizeLkPhone } from "@/lib/validation/entry";
import {
  TICKET_SLIP_BUCKET,
  type TicketAvailability,
  type TicketPurchaseStatus,
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

  // No buyer notification of any kind — buyers self-check with reference +
  // phone/email at /tickets/status instead (see getPurchaseStatus below).
  //
  // This purchase may have been the one that used up the last seat(s) — log
  // it once, right when that happens (visible on /admin/audit), rather than
  // on every purchase. Later attempts are rejected by the RPC before reaching
  // here (SOLD_OUT), so this naturally fires exactly once.
  const availability = await getAvailability();
  if (availability.left <= 0) {
    await logAudit(
      "tickets.sold_out",
      { capacity: availability.capacity, last_purchase_reference: reference },
      null,
    );
  }

  return { ok: true, reference };
}

// ---- admin review ------------------------------------------------------

export async function approvePurchase(
  purchaseId: string,
  by: string,
): Promise<{ ok: boolean; error?: string }> {
  const db = createAdminClient();

  // Claim the purchase atomically FIRST, guarded on its current status, before
  // issuing anything. Two admins clicking "Approve" on the same purchase at
  // the same moment (or one double-click racing itself) both used to pass a
  // plain SELECT-then-check and both go on to insert tickets — one real
  // payment could mint 2x (or more) valid QR codes. Only the caller whose
  // UPDATE actually matches `status = 'pending_review'` gets a row back; every
  // other concurrent caller sees `null` and stops before creating anything.
  const { data: claimed, error: claimErr } = await db
    .from("ticket_purchases")
    .update({
      status: "approved",
      reviewed_by: by,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", purchaseId)
    .eq("status", "pending_review")
    .select("*")
    .maybeSingle();
  if (claimErr) return { ok: false, error: "Could not update the purchase." };

  if (!claimed) {
    const { data: current } = await db
      .from("ticket_purchases")
      .select("status")
      .eq("id", purchaseId)
      .maybeSingle();
    if (!current) return { ok: false, error: "Purchase not found." };
    // Already approved (by us or a concurrent caller) — idempotent success,
    // same as the plain-SELECT version's intent, just race-safe now.
    if (current.status === "approved") return { ok: true };
    return { ok: false, error: `This purchase is ${current.status}.` };
  }
  const purchase = claimed;

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
    // We already claimed the purchase as approved above — undo that so it's
    // still reviewable (and re-approvable) rather than stuck "approved" with
    // no tickets to show for it.
    await db
      .from("ticket_purchases")
      .update({ status: "pending_review", reviewed_by: null, reviewed_at: null })
      .eq("id", purchase.id);
    return { ok: false, error: "Could not issue the tickets. Try again." };
  }

  await logAudit(
    "ticket.approve",
    { purchase_id: purchase.id, reference: purchase.reference, seats: created.length, by },
    null,
  );

  // No push notification of any kind — the buyer finds their ticket(s)
  // themselves at /tickets/status (reference + phone/email), which links to
  // /ticket/[token] for the QR. Nothing to send, nothing to fail.
  return { ok: true };
}

export async function rejectPurchase(
  purchaseId: string,
  by: string,
  note: string,
): Promise<{ ok: boolean; error?: string }> {
  const db = createAdminClient();

  // Same race as approvePurchase: guard the transition atomically on the
  // current status so a reject racing an approve for the same purchase can't
  // both go through (leaving tickets issued for a "rejected" purchase, or a
  // rejection email sent for one that's actually approved).
  const { data: purchase, error } = await db
    .from("ticket_purchases")
    .update({
      status: "rejected",
      review_note: note || null,
      reviewed_by: by,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", purchaseId)
    .eq("status", "pending_review")
    .select("*")
    .maybeSingle();
  if (error) return { ok: false, error: "Could not update the purchase." };

  if (!purchase) {
    const { data: current } = await db
      .from("ticket_purchases")
      .select("status")
      .eq("id", purchaseId)
      .maybeSingle();
    if (!current) return { ok: false, error: "Purchase not found." };
    if (current.status === "approved") {
      return { ok: false, error: "This purchase is already approved — reverse it another way." };
    }
    return { ok: false, error: `This purchase is already ${current.status}.` };
  }

  revalidatePath("/tickets"); // rejecting frees up the seat(s) it held — see app/tickets/page.tsx (ISR)
  await logAudit(
    "ticket.reject",
    { purchase_id: purchase.id, reference: purchase.reference, by },
    null,
  );

  // No email — the buyer sees the rejection + review note themselves at
  // /tickets/status (see getPurchaseStatus below).
  return { ok: true };
}

// ---- buyer self-service status lookup ----------------------------------

export type PurchaseStatusItem = {
  reference: string;
  status: TicketPurchaseStatus;
  quantity: number;
  reviewNote: string | null;
  /** Only populated once `status === "approved"`. */
  tickets: { token: string; seatLabel: string }[];
};

/**
 * Buyer self-check: just their own phone or email, no login, no reference
 * needed. This is the whole replacement for the old "we'll email you" flow —
 * nothing is pushed to the buyer, they come back and check whenever they
 * like. `contact` is matched against phone (Sri Lankan formats, via
 * normalizeLkPhone) OR email (case-insensitive) — whichever it looks like.
 *
 * Returns every purchase for that contact, newest first — usually one, but a
 * rejected attempt followed by a fresh purchase would show both.
 */
export async function getPurchaseStatus(contact: string): Promise<PurchaseStatusItem[]> {
  const db = createAdminClient();
  const contactTrimmed = contact.trim();
  const emailLower = contactTrimmed.toLowerCase();
  const normalizedPhone = normalizeLkPhone(contactTrimmed);

  const conditions = [`email.eq.${emailLower}`];
  if (normalizedPhone) conditions.push(`phone.eq.${normalizedPhone}`);

  const { data: purchases } = await db
    .from("ticket_purchases")
    .select("*")
    .or(conditions.join(","))
    .order("created_at", { ascending: false });
  if (!purchases || purchases.length === 0) return [];

  const results: PurchaseStatusItem[] = [];
  for (const purchase of purchases) {
    let tickets: { token: string; seatLabel: string }[] = [];
    if (purchase.status === "approved") {
      const { data: rows } = await db
        .from("tickets")
        .select("token, seat_label")
        .eq("purchase_id", purchase.id)
        .order("seat_label", { ascending: true });
      tickets = (rows ?? []).map((t) => ({ token: t.token, seatLabel: t.seat_label }));
    }
    results.push({
      reference: purchase.reference,
      status: purchase.status as TicketPurchaseStatus,
      quantity: purchase.quantity,
      reviewNote: purchase.review_note,
      tickets,
    });
  }
  return results;
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

  // `.is("checked_in_at", null)` makes the flip atomic, but Supabase reports
  // no error when zero rows match it — so without `.select()` here, a second
  // request that loses the race (because a first one already flipped the row
  // between our read above and this update) would still see no error and
  // wrongly report success. Checking the returned row is what actually makes
  // this a guard rather than just a WHERE clause with no visible effect.
  const { data: updated, error } = await db
    .from("tickets")
    .update({ checked_in_at: new Date().toISOString(), checked_in_by: by })
    .eq("id", ticket.id)
    .is("checked_in_at", null)
    .select("checked_in_at")
    .maybeSingle();
  if (error) return { ok: false, error: "Could not check in. Try again." };
  if (!updated) {
    // Lost the race: someone else's check-in landed first. Report the same
    // way as the up-front check above, with the actual winning timestamp.
    const { data: current } = await db
      .from("tickets")
      .select("checked_in_at")
      .eq("id", ticket.id)
      .maybeSingle();
    return { ok: false, error: "Already checked in.", alreadyAt: current?.checked_in_at ?? undefined };
  }

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
