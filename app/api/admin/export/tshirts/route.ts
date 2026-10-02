import { getAdminSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAll } from "@/lib/supabase/fetch-all";
import { toCsv, csvResponse } from "@/lib/csv";
import { logAudit } from "@/lib/audit";

/** Download the T-shirt fulfilment and payment report as a CSV file. */
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return Response.json({ ok: false, error: "Not signed in." }, { status: 401 });
  if (session.role !== "admin") return Response.json({ ok: false, error: "Not authorised." }, { status: 403 });

  const db = createAdminClient();
  const { data, error } = await fetchAll((from, to) =>
    db
      .from("tshirt_orders")
      .select("reference, name, registration_number, faculty, email, phone, tshirt_size, quantity, amount_lkr, status, review_note, collected_by, collected_at, created_at")
      .order("created_at", { ascending: true })
      .order("id")
      .range(from, to),
  );
  if (error) return Response.json({ ok: false, error: "Export failed." }, { status: 500 });

  const headers = ["reference", "name", "registration_number", "faculty", "email", "phone", "tshirt_size", "quantity", "amount_lkr", "status", "review_note", "collected_by", "collected_at", "created_at"];
  const rows = (data ?? []).map((o) => [o.reference, o.name, o.registration_number, o.faculty, o.email, o.phone, o.tshirt_size, o.quantity, o.amount_lkr, o.status, o.review_note, o.collected_by, o.collected_at, o.created_at]);
  await logAudit("export.tshirts", { count: rows.length, by: session.email }, null);
  return csvResponse(`lilac-tshirt-orders-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(headers, rows));
}
