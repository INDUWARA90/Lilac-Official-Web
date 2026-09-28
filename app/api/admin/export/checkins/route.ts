import { getAdminSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { toCsv, csvResponse } from "@/lib/csv";
import { fetchAll } from "@/lib/supabase/fetch-all";

/**
 * GET /api/admin/export/checkins — CSV of every issued ticket and its
 * check-in state (the attendance / door list).
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return Response.json({ ok: false, error: "Not signed in." }, { status: 401 });
  if (session.role !== "admin") {
    return Response.json({ ok: false, error: "Not authorised." }, { status: 403 });
  }

  const db = createAdminClient();
  const [{ data: tickets, error }, { data: purchases }] = await Promise.all([
    fetchAll((from, to) =>
      db
        .from("tickets")
        .select("purchase_id, seat_label, holder_name, checked_in_at, checked_in_by, created_at")
        .order("created_at", { ascending: true })
        .order("id")
        .range(from, to),
    ),
    fetchAll((from, to) =>
      db.from("ticket_purchases").select("id, reference, email, phone").order("id").range(from, to),
    ),
  ]);

  if (error) {
    return Response.json({ ok: false, error: "Export failed." }, { status: 500 });
  }

  const byId = new Map((purchases ?? []).map((p) => [p.id, p]));
  const headers = [
    "reference", "holder_name", "seat_label", "buyer_email", "buyer_phone",
    "checked_in", "checked_in_at", "checked_in_by",
  ];
  const rows = (tickets ?? []).map((t) => {
    const p = byId.get(t.purchase_id);
    return [
      p?.reference, t.holder_name, t.seat_label, p?.email, p?.phone,
      t.checked_in_at ? "yes" : "no", t.checked_in_at, t.checked_in_by,
    ];
  });

  await logAudit("export.checkins", { count: rows.length, by: session.email }, null);

  const stamp = new Date().toISOString().slice(0, 10);
  return csvResponse(`lilac-checkins-${stamp}.csv`, toCsv(headers, rows));
}
