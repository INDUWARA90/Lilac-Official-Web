import { getAdminSession } from "@/lib/auth";
import { csvResponse, toCsv } from "@/lib/csv";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAll } from "@/lib/supabase/fetch-all";

export const dynamic = "force-dynamic";

/** Complete physical-handover report; payment fields are informational only. */
export async function GET() {
  const session = await getAdminSession();
  if (!session) return Response.json({ ok: false, error: "Not signed in." }, { status: 401 });
  if (session.role !== "admin" && session.role !== "tshirt_manager") return Response.json({ ok: false, error: "Not authorised." }, { status: 403 });
  const db = createAdminClient();
  const { data, error } = await fetchAll((from, to) => db.from("tshirt_orders")
    .select("reference, name, registration_number, faculty, email, phone, tshirt_size, quantity, order_items, amount_lkr, paid_amount_lkr, status, review_note, collected_by, collected_at, handed_over, handed_over_at, handed_over_by, created_at")
    .order("handed_over", { ascending: true }).order("created_at", { ascending: true }).order("id").range(from, to));
  if (error) return Response.json({ ok: false, error: "Export failed." }, { status: 500 });
  const headers = ["reference", "name", "registration_number", "faculty", "email", "phone", "shirt_variants", "quantity", "amount_lkr", "paid_amount_lkr", "balance_due_lkr", "payment_status", "payment_note", "payment_collected_by", "payment_collected_at", "handover_status", "handed_over_at", "handed_over_by", "created_at"];
  const rows = data.map((order) => [
    order.reference, order.name, order.registration_number, order.faculty, order.email, order.phone,
    order.order_items?.length ? order.order_items.map((item) => `${item.color} / ${item.size}`).join("; ") : `Size ${order.tshirt_size}; color not recorded`,
    order.quantity, order.amount_lkr, order.paid_amount_lkr, order.paid_amount_lkr === null ? "" : Math.max(0, order.amount_lkr - order.paid_amount_lkr),
    order.status, order.review_note, order.collected_by, order.collected_at, order.handed_over ? "given" : "not_given", order.handed_over_at, order.handed_over_by, order.created_at,
  ]);
  return csvResponse(`lilac-tshirt-handovers-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(headers, rows));
}
