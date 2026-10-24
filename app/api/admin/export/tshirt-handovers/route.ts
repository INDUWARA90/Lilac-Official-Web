import { getAdminSession } from "@/lib/auth";
import { csvResponse, toCsv } from "@/lib/csv";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAll } from "@/lib/supabase/fetch-all";
import { FACULTIES } from "@/lib/tshirts-shared";

export const dynamic = "force-dynamic";

/** Complete physical-handover report; payment fields are informational only. */
export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) return Response.json({ ok: false, error: "Not signed in." }, { status: 401 });
  if (session.role !== "admin" && session.role !== "tshirt_manager") return Response.json({ ok: false, error: "Not authorised." }, { status: 403 });
  const requestedFaculty = new URL(request.url).searchParams.get("faculty") ?? "";
  const faculty = FACULTIES.includes(requestedFaculty as (typeof FACULTIES)[number]) ? requestedFaculty : "";
  const previous = new URL(request.url).searchParams.get("round") === "previous";
  const orderTable = previous ? "tshirt_orders" : "tshirt_new_orders";
  const db = createAdminClient();
  const { data, error } = await fetchAll((from, to) => {
    let query = db.from(orderTable)
      .select("reference, name, registration_number, faculty, email, phone, tshirt_size, quantity, order_items, amount_lkr, paid_amount_lkr, handed_over, handed_over_at")
      .order("handed_over", { ascending: true }).order("created_at", { ascending: true }).order("id").range(from, to);
    if (faculty) query = query.eq("faculty", faculty);
    return query;
  });
  if (error) return Response.json({ ok: false, error: "Export failed." }, { status: 500 });
  const headers = ["reference", "name", "registration_number", "faculty", "email", "phone", "shirt_variants", "quantity", "amount_lkr", "paid_amount_lkr", "balance_due_lkr", "handover_status", "handed_over_at"];
  const rows = data.map((order) => [
    order.reference, order.name, order.registration_number, order.faculty, order.email, order.phone,
    order.order_items?.length ? order.order_items.map((item) => `${item.color} / ${item.size}`).join("; ") : `Size ${order.tshirt_size}; color not recorded`,
    order.quantity, order.amount_lkr, order.paid_amount_lkr, order.paid_amount_lkr === null ? "" : Math.max(0, order.amount_lkr - order.paid_amount_lkr),
    order.handed_over ? "given" : "not_given", order.handed_over_at,
  ]);
  const facultySuffix = faculty ? `-${faculty.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}` : "";
  return csvResponse(`lilac-${previous ? "previous-" : ""}tshirt-handovers${facultySuffix}-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(headers, rows));
}
