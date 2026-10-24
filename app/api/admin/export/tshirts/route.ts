import { getAdminSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAll } from "@/lib/supabase/fetch-all";
import { toCsv, csvResponse } from "@/lib/csv";
import { FACULTIES } from "@/lib/tshirts-shared";

/** Download the T-shirt fulfilment and payment report as a CSV file. */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getAdminSession();
  if (!session) return Response.json({ ok: false, error: "Not signed in." }, { status: 401 });
  if (session.role !== "admin" && session.role !== "tshirt_manager") return Response.json({ ok: false, error: "Not authorised." }, { status: 403 });

  const requestedFaculty = new URL(req.url).searchParams.get("faculty") ?? "";
  const faculty = FACULTIES.includes(requestedFaculty as typeof FACULTIES[number])
    ? requestedFaculty
    : "";
  const db = createAdminClient();
  const { data, error } = await fetchAll((from, to) => {
    let query = db
      .from("tshirt_new_orders")
      .select("reference, name, registration_number, faculty, email, phone, tshirt_size, quantity, order_items, amount_lkr, paid_amount_lkr, status, review_note, collected_by, collected_at, created_at")
      .order("faculty", { ascending: true })
      .order("created_at", { ascending: true })
      .order("id");
    if (faculty) query = query.eq("faculty", faculty);
    return query.range(from, to);
  });
  if (error) return Response.json({ ok: false, error: "Export failed." }, { status: 500 });

  const headers = ["reference", "name", "registration_number", "faculty", "email", "phone", "shirt_variants", "quantity", "amount_lkr", "paid_amount_lkr", "balance_due_lkr", "status", "review_note", "collected_by", "collected_at", "created_at"];
  const rows = (data ?? []).map((o) => [
    o.reference, o.name, o.registration_number, o.faculty, o.email, o.phone,
    o.order_items?.length ? o.order_items.map((item) => `${item.color} / ${item.size}`).join("; ") : `Size ${o.tshirt_size}; color not recorded`,
    o.quantity, o.amount_lkr, o.paid_amount_lkr,
    o.paid_amount_lkr === null ? "" : Math.max(0, o.amount_lkr - o.paid_amount_lkr),
    o.status, o.review_note, o.collected_by, o.collected_at, o.created_at,
  ]);
  const suffix = faculty
    ? `-${faculty.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`
    : "-by-faculty";
  return csvResponse(`lailac-tshirt-orders${suffix}-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(headers, rows));
}
