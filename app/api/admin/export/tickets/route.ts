import { getAdminSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { toCsv, csvResponse } from "@/lib/csv";

/** GET /api/admin/export/tickets — CSV of every ticket purchase (sales report). */
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return Response.json({ ok: false, error: "Not signed in." }, { status: 401 });

  const { data, error } = await createAdminClient()
    .from("ticket_purchases")
    .select(
      "reference, name, email, phone, quantity, amount_lkr, status, review_note, reviewed_by, reviewed_at, created_at",
    )
    .order("created_at", { ascending: true });

  if (error) {
    return Response.json({ ok: false, error: "Export failed." }, { status: 500 });
  }

  const headers = [
    "reference", "name", "email", "phone", "quantity", "amount_lkr",
    "status", "review_note", "reviewed_by", "reviewed_at", "created_at",
  ];
  const rows = (data ?? []).map((p) => [
    p.reference, p.name, p.email, p.phone, p.quantity, p.amount_lkr,
    p.status, p.review_note, p.reviewed_by, p.reviewed_at, p.created_at,
  ]);

  await logAudit("export.tickets", { count: rows.length, by: session.email }, null);

  const stamp = new Date().toISOString().slice(0, 10);
  return csvResponse(`lilac-ticket-purchases-${stamp}.csv`, toCsv(headers, rows));
}
