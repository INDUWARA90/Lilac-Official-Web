import "server-only";
import { randomInt } from "node:crypto";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { TSHIRT_RECEIPT_BUCKET } from "@/lib/tshirts-shared";

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const TSHIRT_LINKS_TAG = "tshirt-link-visible";
function reference() { let s = ""; for (let i = 0; i < 6; i++) s += ALPHABET[randomInt(ALPHABET.length)]; return `TS-${s}`; }

export async function getTshirtSettings() {
  const { data, error } = await createAdminClient().from("tshirt_settings").select("price_lkr, sales_open, tshirt_link_visible").eq("id", "default").maybeSingle();
  if (error) console.error(`T-shirt settings lookup failed: ${error.code ?? "unknown"}`);
  return {
    priceLkr: data?.price_lkr ?? 2500,
    salesOpen: data?.sales_open ?? true,
    tshirtLinkVisible: data?.tshirt_link_visible ?? true,
  };
}

async function fetchTshirtLinkVisible(): Promise<boolean> {
  const { data, error } = await createAdminClient()
    .from("tshirt_settings")
    .select("tshirt_link_visible")
    .eq("id", "default")
    .maybeSingle();
  if (error) {
    console.error(`T-shirt link visibility lookup failed: ${error.code ?? "unknown"}`);
    return true;
  }
  return data?.tshirt_link_visible ?? true;
}

export const getTshirtLinkVisible = unstable_cache(fetchTshirtLinkVisible, [TSHIRT_LINKS_TAG], {
  tags: [TSHIRT_LINKS_TAG],
  revalidate: 60,
});

export async function updateTshirtLinkVisible(visible: boolean, by: string): Promise<boolean> {
  const { error } = await createAdminClient()
    .from("tshirt_settings")
    .update({
      tshirt_link_visible: visible,
      updated_at: new Date().toISOString(),
      updated_by: by,
    })
    .eq("id", "default");
  if (error) {
    console.error(`T-shirt link visibility update failed: ${error.code ?? "unknown"}`);
    return false;
  }
  revalidatePath("/");
  revalidateTag(TSHIRT_LINKS_TAG, { expire: 0 });
  return true;
}

export async function createTshirtOrder(input: { name: string; registrationNumber: string; faculty: string; email: string; phone: string; items: Array<{ size: string; color: string }>; paidAmountLkr: number; receiptPath: string }) {
  const db = createAdminClient();
  const { data: files } = await db.storage.from(TSHIRT_RECEIPT_BUCKET).list("", { search: input.receiptPath });
  if (!files?.some((file) => file.name === input.receiptPath)) return { ok: false as const, error: "Your receipt upload was not found. Please attach it again." };
  const ref = reference();
  const { error } = await db.rpc("create_tshirt_order", {
    p_name: input.name, p_registration_number: input.registrationNumber, p_faculty: input.faculty,
    p_email: input.email, p_phone: input.phone, p_order_items: input.items,
    p_paid_amount_lkr: input.paidAmountLkr,
    p_receipt_path: input.receiptPath, p_reference: ref,
  });
  if (error) {
    if (error.code === "PGRST202" || error.code === "42883") {
      console.error(`T-shirt order RPC is unavailable: ${error.code}`);
      return {
        ok: false as const,
        error: "The order system is not fully updated yet. Please contact the organiser.",
      };
    }
    console.error(`T-shirt order creation failed: ${error.code ?? "unknown"}`);
    return {
    ok: false as const,
    error: error.message.includes("SALES_CLOSED")
      ? "T-shirt orders are currently closed."
      : error.message.includes("BAD_PAYMENT_AMOUNT")
        ? "Payment must be at least LKR 1,000 per T-shirt and cannot exceed the order total."
        : "Could not place your order. Please try again.",
    };
  }
  return { ok: true as const, reference: ref };
}

export async function reviewTshirtOrder(id: string, action: "collect" | "collect_balance" | "reject", by: string, note = "") {
  const db = createAdminClient();
  let currentStatus: "pending_review" | "partially_paid";
  let status: "partially_paid" | "payment_collected" | "rejected";
  const values: { status: typeof status; review_note: string | null; collected_by: string; collected_at: string; updated_at: string; paid_amount_lkr?: number } = {
    status: "rejected",
    review_note: note || null,
    collected_by: by,
    collected_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (action === "collect") {
    const { data: order, error: lookupError } = await db.from("tshirt_orders").select("amount_lkr, paid_amount_lkr").eq("id", id).eq("status", "pending_review").maybeSingle();
    if (lookupError) return { ok: false, error: "Could not load the order for review." };
    if (!order) return { ok: false, error: "This order has already been reviewed." };
    currentStatus = "pending_review";
    const paidAmountLkr = order.paid_amount_lkr ?? order.amount_lkr;
    status = paidAmountLkr < order.amount_lkr ? "partially_paid" : "payment_collected";
    values.paid_amount_lkr = paidAmountLkr;
  } else if (action === "collect_balance") {
    const { data: order, error: lookupError } = await db.from("tshirt_orders").select("amount_lkr").eq("id", id).eq("status", "partially_paid").maybeSingle();
    if (lookupError) return { ok: false, error: "Could not load the order for review." };
    if (!order) return { ok: false, error: "This order is not awaiting a balance payment." };
    currentStatus = "partially_paid";
    status = "payment_collected";
    values.paid_amount_lkr = order.amount_lkr;
  } else {
    currentStatus = "pending_review";
    status = "rejected";
  }
  values.status = status;
  const { data, error } = await db.from("tshirt_orders").update(values).eq("id", id).eq("status", currentStatus).select("reference").maybeSingle();
  if (error) return { ok: false, error: "Could not update the order." };
  if (!data) return { ok: false, error: "This order has already been reviewed." };
  return { ok: true };
}

/** Records the physical handover independently of payment status. */
export async function markTshirtHandedOver(id: string, by: string): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await createAdminClient()
    .from("tshirt_orders")
    .update({ handed_over: true, handed_over_at: new Date().toISOString(), handed_over_by: by, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("handed_over", false)
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, error: "Could not record the handover." };
  if (!data) return { ok: false, error: "This order was already handed over or no longer exists." };
  return { ok: true };
}

/** Reopens a handover record when a staff member needs to correct it. */
export async function markTshirtNotHandedOver(id: string): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await createAdminClient()
    .from("tshirt_orders")
    .update({ handed_over: false, handed_over_at: null, handed_over_by: null, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("handed_over", true)
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, error: "Could not reopen the handover." };
  if (!data) return { ok: false, error: "This order is already marked as not given or no longer exists." };
  return { ok: true };
}

export async function tshirtReceiptUrl(path: string) {
  const { data } = await createAdminClient().storage.from(TSHIRT_RECEIPT_BUCKET).createSignedUrl(path, 60 * 60 * 24 * 30);
  return data?.signedUrl ?? null;
}
