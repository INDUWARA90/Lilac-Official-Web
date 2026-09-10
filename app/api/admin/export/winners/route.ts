import { getAdminSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { toCsv, csvResponse } from "@/lib/csv";

/** GET /api/admin/export/winners — CSV of winners only. */
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return Response.json({ ok: false, error: "Not signed in." }, { status: 401 });

  const db = createAdminClient();

  const { data: winners, error } = await db
    .from("winners")
    .select("id, entry_id, draw_id, email_status, email_sent_at, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    return Response.json({ ok: false, error: "Export failed." }, { status: 500 });
  }

  // Join entry details in JS (small volume, keeps the query simple).
  const entryIds = [...new Set((winners ?? []).map((w) => w.entry_id))];
  const { data: entries } = await db
    .from("entries")
    .select("id, name, email, phone, district")
    .in("id", entryIds.length ? entryIds : ["00000000-0000-0000-0000-000000000000"]);
  const byId = new Map((entries ?? []).map((e) => [e.id, e]));

  const headers = [
    "name", "email", "phone", "district",
    "draw_id", "email_status", "email_sent_at", "won_at",
  ];
  const rows = (winners ?? []).map((w) => {
    const e = byId.get(w.entry_id);
    return [
      e?.name, e?.email, e?.phone, e?.district,
      w.draw_id, w.email_status, w.email_sent_at, w.created_at,
    ];
  });

  await logAudit("export.winners", { count: rows.length, by: session.email }, null);

  const stamp = new Date().toISOString().slice(0, 10);
  return csvResponse(`lilac-winners-${stamp}.csv`, toCsv(headers, rows));
}
