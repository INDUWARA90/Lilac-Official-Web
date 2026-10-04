import "server-only";
import { randomInt } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { TSHIRT_RECEIPT_BUCKET } from "@/lib/tshirts-shared";

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
function reference() { let s = ""; for (let i = 0; i < 6; i++) s += ALPHABET[randomInt(ALPHABET.length)]; return `TS-${s}`; }

export async function getTshirtSettings() {
  const { data } = await createAdminClient().from("tshirt_settings").select("price_lkr, sales_open").eq("id", "default").maybeSingle();
  return { priceLkr: data?.price_lkr ?? 2500, salesOpen: data?.sales_open ?? true };
}

export async function createTshirtOrder(input: { name: string; registrationNumber: string; faculty: string; email: string; phone: string; size: string; quantity: number; receiptPath: string }) {
  const db = createAdminClient();
  const { data: files } = await db.storage.from(TSHIRT_RECEIPT_BUCKET).list("", { search: input.receiptPath });
  if (!files?.some((file) => file.name === input.receiptPath)) return { ok: false as const, error: "Your receipt upload was not found. Please attach it again." };
  const ref = reference();
  const { error } = await db.rpc("create_tshirt_order", {
    p_name: input.name, p_registration_number: input.registrationNumber, p_faculty: input.faculty,
    p_email: input.email, p_phone: input.phone, p_tshirt_size: input.size, p_quantity: input.quantity,
    p_receipt_path: input.receiptPath, p_reference: ref,
  });
  if (error) return { ok: false as const, error: error.message.includes("SALES_CLOSED") ? "T-shirt orders are currently closed." : "Could not place your order. Please try again." };
  return { ok: true as const, reference: ref };
}

export async function reviewTshirtOrder(id: string, action: "collect" | "reject", by: string, note = "") {
  const db = createAdminClient();
  const status = action === "collect" ? "payment_collected" : "rejected";
  const { data, error } = await db.from("tshirt_orders").update({ status, review_note: note || null, collected_by: by, collected_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id).eq("status", "pending_review").select("reference").maybeSingle();
  if (error) return { ok: false, error: "Could not update the order." };
  if (!data) return { ok: false, error: "This order has already been reviewed." };
  return { ok: true };
}

export async function tshirtReceiptUrl(path: string) {
  const { data } = await createAdminClient().storage.from(TSHIRT_RECEIPT_BUCKET).createSignedUrl(path, 60 * 60 * 24 * 30);
  return data?.signedUrl ?? null;
}
