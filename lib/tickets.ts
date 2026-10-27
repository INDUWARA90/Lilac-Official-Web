import "server-only";
import { randomBytes, randomInt } from "node:crypto";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import QRCode from "qrcode";
import { createAdminClient } from "@/lib/supabase/admin";
import { publicEnv, serverEnv } from "@/lib/env";
import { normalizeLkPhone } from "@/lib/validation/entry";
import {
  TICKET_SLIP_BUCKET,
  type TicketAvailability,
  type TicketPurchaseStatus,
  type TicketSettings,
  type TicketType,
} from "@/lib/tickets-shared";
import type { TicketPurchaseRow, TicketRow, TicketSettingsRow } from "@/lib/supabase/types";

// ---- ids ------------------------------------------------------------------

const REF_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // no I L O U
const TICKET_LINKS_TAG = "ticket-links-visible";

/** Human-readable purchase reference, e.g. LAILAC-7K2M9. */
function newReference(): string {
  let s = "";
  for (let i = 0; i < 6; i++) s += REF_ALPHABET[randomInt(REF_ALPHABET.length)];
  return `LAILAC-${s}`;
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
    seatingPriceLkr: data?.seating_price_lkr ?? 500,
    standingPriceLkr: data?.standing_price_lkr ?? 300,
    seatingCapacity: data?.seating_capacity ?? 100,
    standingCapacity: data?.standing_capacity ?? 100,
    salesOpen: data?.sales_open ?? true,
    ticketLinksVisible: data?.ticket_links_visible ?? true,
    bankName: data?.bank_name ?? "",
    bankAccountName: data?.bank_account_name ?? "",
    bankAccountNumber: data?.bank_account_number ?? "",
    bankBranch: data?.bank_branch ?? "",
    bankInstructions: data?.bank_instructions ?? "",
  };
}

async function fetchTicketLinksVisible(): Promise<boolean> {
  const { data, error } = await createAdminClient()
    .from("ticket_settings")
    .select("ticket_links_visible")
    .eq("id", "default")
    .maybeSingle();
  if (error) {
    console.error(`ticket link visibility lookup failed: ${error.code ?? "unknown"}`);
    return true;
  }
  return data?.ticket_links_visible ?? true;
}

export const getTicketLinksVisible = unstable_cache(fetchTicketLinksVisible, [TICKET_LINKS_TAG], {
  tags: [TICKET_LINKS_TAG],
  revalidate: 60,
});

export async function getAvailability(): Promise<TicketAvailability> {
  const db = createAdminClient();
  const [
    { data: settings, error: settingsError },
    { data: totals, error: totalsError },
  ] = await Promise.all([
    db
      .from("ticket_settings")
      .select("seating_capacity, standing_capacity, sales_open, ticket_links_visible")
      .eq("id", "default")
      .maybeSingle(),
    db.rpc("get_ticket_capacity_totals"),
  ]);

  if (settingsError) {
    console.error(`ticket availability settings lookup failed: ${settingsError.code ?? "unknown"}`);
    throw new Error("Could not load ticket availability settings.");
  }
  let seatingTaken = totals?.[0]?.seating_taken;
  let standingTaken = totals?.[0]?.standing_taken;

  // Older deployments may not have migration 0024 yet, which creates the
  // compact totals RPC. Fall back to the source rows so admin pages and ticket
  // sales keep an accurate capacity count while that migration is applied.
  if (totalsError || seatingTaken === undefined || standingTaken === undefined) {
    console.error(
      `ticket capacity totals RPC unavailable: ${totalsError?.message ?? totalsError?.code ?? "missing result"}`,
    );
    const { data: purchases, error: purchasesError } = await db
      .from("ticket_purchases")
      .select("ticket_types")
      .in("status", ["pending_review", "approved"]);
    if (purchasesError) {
      console.error(`ticket capacity fallback lookup failed: ${purchasesError.message ?? purchasesError.code}`);
      throw new Error("Could not load ticket capacity totals.");
    }

    seatingTaken = 0;
    standingTaken = 0;
    for (const purchase of purchases ?? []) {
      for (const ticketType of purchase.ticket_types) {
        if (ticketType === "seating") seatingTaken += 1;
        if (ticketType === "standing") standingTaken += 1;
      }
    }
  }

  const seatingCapacity = settings?.seating_capacity ?? 100;
  const standingCapacity = settings?.standing_capacity ?? 100;
  const seatingLeft = Math.max(0, seatingCapacity - seatingTaken);
  const standingLeft = Math.max(0, standingCapacity - standingTaken);
  return {
    seating: { capacity: seatingCapacity, taken: seatingTaken, left: seatingLeft },
    standing: { capacity: standingCapacity, taken: standingTaken, left: standingLeft },
    capacity: seatingCapacity + standingCapacity,
    taken: seatingTaken + standingTaken,
    left: seatingLeft + standingLeft,
    salesOpen: settings?.sales_open ?? true,
    ticketLinksVisible: settings?.ticket_links_visible ?? true,
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
  if (patch.seatingPriceLkr !== undefined) row.seating_price_lkr = patch.seatingPriceLkr;
  if (patch.standingPriceLkr !== undefined) row.standing_price_lkr = patch.standingPriceLkr;
  if (patch.seatingCapacity !== undefined) row.seating_capacity = patch.seatingCapacity;
  if (patch.standingCapacity !== undefined) row.standing_capacity = patch.standingCapacity;
  if (patch.salesOpen !== undefined) row.sales_open = patch.salesOpen;
  if (patch.ticketLinksVisible !== undefined) row.ticket_links_visible = patch.ticketLinksVisible;
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
    revalidatePath("/tickets"); // price/capacity/sales-open changed — see app/tickets/page.tsx (ISR)
    revalidatePath("/");
    revalidateTag(TICKET_LINKS_TAG, { expire: 0 });
  } else {
    console.error(`ticket settings update failed: ${error.code ?? "unknown"}`);
  }
  return !error;
}

// ---- purchase -----------------------------------------------------------

type CreateResult =
  | { ok: true; reference: string }
  | { ok: false; error: string; soldOut?: boolean };

export async function createPurchase(input: {
  name: string;
  registrationNumber: string;
  faculty: string;
  email: string;
  phone: string;
  ticketTypes: TicketType[];
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
    p_registration_number: input.registrationNumber,
    p_faculty: input.faculty,
    p_email: input.email,
    p_phone: input.phone,
    p_ticket_types: input.ticketTypes,
    p_quantity: input.quantity,
    p_slip_path: input.slipPath,
    p_reference: reference,
  });

  if (error) {
    const m = error.message || "";
    if (m.includes("SOLD_OUT_SEATING")) {
      return { ok: false, error: "Sorry — seating tickets just sold out.", soldOut: true };
    }
    if (m.includes("SOLD_OUT_STANDING")) {
      return { ok: false, error: "Sorry — standing tickets just sold out.", soldOut: true };
    }
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

  revalidatePath("/tickets");   // availability just changed — see app/tickets/page.tsx (ISR)

  // No buyer notification of any kind — buyers self-check with reference +
  // phone/email at /tickets/status instead (see getPurchaseStatus below).
  //
  return { ok: true, reference };
}

// ---- admin review ------------------------------------------------------

export async function approvePurchase(
  purchaseId: string,
  by: string,
): Promise<{ ok: boolean; error?: string; emailSent?: boolean }> {
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

  const ticketTypeCounts = purchase.ticket_types.reduce(
    (counts, type) => ({ ...counts, [type]: counts[type] + 1 }),
    { seating: 0, standing: 0 },
  );
  const issuedTypeCounts: Record<TicketType, number> = { seating: 0, standing: 0 };
  const rows = purchase.ticket_types.map((ticketType) => {
    issuedTypeCounts[ticketType] += 1;
    const typeName = ticketType === "seating" ? "Seating" : "Standing";
    return {
      purchase_id: purchase.id,
      token: newToken(),
      seat_label: `${typeName}${
        ticketTypeCounts[ticketType] === 1
          ? ""
          : ` ${issuedTypeCounts[ticketType]} of ${ticketTypeCounts[ticketType]}`
      }`,
      holder_name: purchase.name,
    };
  });

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

  // The local NestJS SMTP service sends this one purchase immediately. If it
  // is offline, `npm run send:pending` later finds this approved purchase.
  return { ok: true, emailSent: await notifyTicketMailer(purchase.id) };
}

async function notifyTicketMailer(purchaseId: string): Promise<boolean> {
  const { url, apiKey } = serverEnv.ticketMailer;
  if (!url || !apiKey) return false;
  try {
    const response = await fetch(`${url}/ticket-emails/${purchaseId}/send`, {
      method: "POST", headers: { "x-mailer-key": apiKey }, cache: "no-store",
    });
    const data = (await response.json().catch(() => null)) as { sent?: boolean } | null;
    return response.ok && data?.sent === true;
  } catch {
    return false;
  }
}

/** Records an email the staff member sent outside the automated SMTP queue. */
export async function markTicketEmailSentManually(
  purchaseId: string,
  by: string,
): Promise<{ ok: boolean; error?: string }> {
  const db = createAdminClient();
  const { data: purchase, error: purchaseError } = await db
    .from("ticket_purchases")
    .select("id, status")
    .eq("id", purchaseId)
    .maybeSingle();
  if (purchaseError || !purchase) return { ok: false, error: "Ticket purchase not found." };
  if (purchase.status !== "approved") return { ok: false, error: "Only approved ticket emails can be marked sent." };

  const { data: existing, error: deliveryError } = await db
    .from("ticket_email_deliveries")
    .select("id, status")
    .eq("purchase_id", purchaseId)
    .maybeSingle();
  if (deliveryError) return { ok: false, error: "Could not check email delivery status." };
  if (existing?.status === "sending") return { ok: false, error: "The automated email is currently sending. Wait a moment and refresh." };

  const now = new Date().toISOString();
  const update = {
    status: "sent" as const,
    locked_at: null,
    sent_at: now,
    provider_message_id: `manual:${by}`.slice(0, 500),
    last_error: null,
    updated_at: now,
  };
  const { error } = existing
    ? await db.from("ticket_email_deliveries").update(update).eq("id", existing.id)
    : await db.from("ticket_email_deliveries").insert({ purchase_id: purchaseId, attempts: 0, ...update });
  return error ? { ok: false, error: "Could not mark the email as sent." } : { ok: true };
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

  // No email — the buyer sees the rejection + review note themselves at
  // /tickets/status (see getPurchaseStatus below).
  return { ok: true };
}

/**
 * Withdraw issued QR codes and return an approved purchase to review so staff
 * can correct it and issue a fresh replacement set of tickets.
 */
export async function deactivatePurchase(
  purchaseId: string,
  by: string,
  note: string,
): Promise<{ ok: boolean; error?: string; emailSent?: boolean }> {
  const db = createAdminClient();
  const now = new Date().toISOString();
  const { data: purchase, error } = await db
    .from("ticket_purchases")
    .update({
      status: "pending_review",
      review_note: note || "Tickets withdrawn by event staff for correction and reissue.",
      reviewed_by: by,
      reviewed_at: now,
      updated_at: now,
    })
    .eq("id", purchaseId)
    .eq("status", "approved")
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, error: "Could not deactivate the purchase." };
  if (!purchase) {
    const { data: current } = await db
      .from("ticket_purchases")
      .select("status")
      .eq("id", purchaseId)
      .maybeSingle();
    if (!current) return { ok: false, error: "Purchase not found." };
    return { ok: false, error: `Only approved purchases can be deactivated (currently ${current.status}).` };
  }

  // Old tokens must never come back when this purchase is approved again.
  // Clearing delivery state makes the normal approval flow send the new QR set.
  const [{ error: ticketsError }, { error: deliveryError }] = await Promise.all([
    db.from("tickets").delete().eq("purchase_id", purchaseId),
    db.from("ticket_email_deliveries").delete().eq("purchase_id", purchaseId),
  ]);
  if (ticketsError || deliveryError) {
    console.error("deactivatePurchase cleanup failed", ticketsError ?? deliveryError);
    return { ok: false, error: "Tickets were returned to review, but old ticket cleanup failed. Do not approve yet; refresh and contact an administrator." };
  }

  revalidatePath("/tickets");
  return { ok: true, emailSent: await notifyTicketDeactivationMailer(purchaseId) };
}

/** Restores a legacy cancelled purchase to the same replacement-review flow. */
export async function restoreCancelledPurchaseToReview(
  purchaseId: string,
  by: string,
): Promise<{ ok: boolean; error?: string }> {
  const db = createAdminClient();
  const now = new Date().toISOString();
  const { data: purchase, error } = await db
    .from("ticket_purchases")
    .update({
      status: "pending_review",
      review_note: "Returned to pending review by event staff for correction and reissue.",
      reviewed_by: by,
      reviewed_at: now,
      updated_at: now,
    })
    .eq("id", purchaseId)
    .eq("status", "cancelled")
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, error: "Could not return the purchase to review." };
  if (!purchase) return { ok: false, error: "Only deactivated purchases can be returned to review." };

  const [{ error: ticketsError }, { error: deliveryError }] = await Promise.all([
    db.from("tickets").delete().eq("purchase_id", purchaseId),
    db.from("ticket_email_deliveries").delete().eq("purchase_id", purchaseId),
  ]);
  if (ticketsError || deliveryError) {
    console.error("restoreCancelledPurchaseToReview cleanup failed", ticketsError ?? deliveryError);
    return { ok: false, error: "Purchase was returned to review, but old ticket cleanup failed. Do not approve it yet." };
  }
  revalidatePath("/tickets");
  return { ok: true };
}

async function notifyTicketDeactivationMailer(purchaseId: string): Promise<boolean> {
  const { url, apiKey } = serverEnv.ticketMailer;
  if (!url || !apiKey) return false;
  try {
    const response = await fetch(`${url}/ticket-emails/${purchaseId}/deactivation`, {
      method: "POST", headers: { "x-mailer-key": apiKey }, cache: "no-store",
    });
    const data = (await response.json().catch(() => null)) as { sent?: boolean } | null;
    return response.ok && data?.sent === true;
  } catch {
    return false;
  }
}

/**
 * Reconcile a pending order with the amount on its bank slip. This is limited
 * to removing tickets from the original selection, so the correction can
 * never consume extra capacity or silently change a buyer's ticket type.
 */
// ---- buyer self-service status lookup ----------------------------------

export type PurchaseStatusItem = {
  reference: string;
  phone: string;
  email: string;
  status: TicketPurchaseStatus;
  ticketTypes: TicketType[];
  quantity: number;
  reviewNote: string | null;
  /** Only populated once `status === "approved"`. */
  tickets: { token: string; seatLabel: string }[];
};

/**
 * Buyer self-check by phone, email, or reference. Each database query uses a
 * separate equality filter so user input cannot modify the PostgREST query.
 */
export async function getPurchaseStatus(contact: string): Promise<PurchaseStatusItem[]> {
  const db = createAdminClient();
  const contactTrimmed = contact.trim();
  const emailLower = contactTrimmed.toLowerCase();
  const normalizedPhone = normalizeLkPhone(contactTrimmed);
  const [byReference, byEmail, byPhone] = await Promise.all([
    db
      .from("ticket_purchases")
      .select("*")
      .eq("reference", contactTrimmed.toUpperCase()),
    contactTrimmed.includes("@")
      ? db.from("ticket_purchases").select("*").eq("email", emailLower)
      : null,
    normalizedPhone ? db.from("ticket_purchases").select("*").eq("phone", normalizedPhone) : null,
  ]);
  const found = new Map<string, TicketPurchaseRow>();
  for (const purchase of [
    ...(byReference.data ?? []),
    ...(byEmail?.data ?? []),
    ...(byPhone?.data ?? []),
  ]) {
    found.set(purchase.id, purchase);
  }
  const purchases = [...found.values()].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );
  if (purchases.length === 0) return [];

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
      phone: purchase.phone,
      email: purchase.email,
      status: purchase.status as TicketPurchaseStatus,
      ticketTypes: purchase.ticket_types,
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
  purchaseName: string;
  purchaseRegistrationNumber: string;
  purchaseFaculty: string;
  purchaseStatus: TicketPurchaseStatus;
};

export async function getTicketByToken(token: string): Promise<CheckInLookup | null> {
  const db = createAdminClient();
  const { data: ticket } = await db.from("tickets").select("*").eq("token", token).maybeSingle();
  if (!ticket) return null;
  const { data: purchase } = await db
    .from("ticket_purchases")
    .select("reference, name, registration_number, faculty, status")
    .eq("id", ticket.purchase_id)
    .maybeSingle();
  return {
    ticket,
    purchaseReference: purchase?.reference ?? "",
    purchaseName: purchase?.name ?? ticket.holder_name,
    purchaseRegistrationNumber: purchase?.registration_number ?? "",
    purchaseFaculty: purchase?.faculty ?? "",
    // A missing purchase is an invalid ticket state; treat it as cancelled so
    // callers never accidentally render it as a valid, approved ticket.
    purchaseStatus: (purchase?.status as TicketPurchaseStatus | undefined) ?? "cancelled",
  };
}

export async function checkInTicket(
  token: string,
  by: string,
): Promise<{ ok: boolean; error?: string; alreadyAt?: string }> {
  const db = createAdminClient();
  const { data: ticket } = await db.from("tickets").select("*").eq("token", token).maybeSingle();
  if (!ticket) return { ok: false, error: "Ticket not found." };
  const { data: purchase } = await db
    .from("ticket_purchases")
    .select("status")
    .eq("id", ticket.purchase_id)
    .maybeSingle();
  if (purchase?.status !== "approved") {
    return { ok: false, error: "This ticket is no longer valid." };
  }
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

  return { ok: true };
}

export async function undoCheckIn(token: string): Promise<{ ok: boolean; error?: string }> {
  const db = createAdminClient();
  const { data: ticket } = await db.from("tickets").select("id").eq("token", token).maybeSingle();
  if (!ticket) return { ok: false, error: "Ticket not found." };
  const { error } = await db
    .from("tickets")
    .update({ checked_in_at: null, checked_in_by: null })
    .eq("id", ticket.id);
  if (error) return { ok: false, error: "Could not update the ticket." };
  return { ok: true };
}

// ---- slips -----------------------------------------------------------

export async function slipDownloadUrl(path: string): Promise<string | null> {
  const { data } = await createAdminClient()
    .storage.from(TICKET_SLIP_BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 30);
  return data?.signedUrl ?? null;
}

export async function qrDataUrl(token: string): Promise<string> {
  return QRCode.toDataURL(checkinUrl(token), { width: 320, margin: 1 });
}
