import { getAdminSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { toCsv, csvResponse } from "@/lib/csv";

/** GET /api/admin/export/entries — CSV of every entry. */
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return Response.json({ ok: false, error: "Not signed in." }, { status: 401 });

  const { data, error } = await createAdminClient()
    .from("entries")
    .select(
      "ticket_code, name, email, phone, address, age_range, gender, occupation, district, verified, verified_at, ad_watched_at, consent_at, created_at",
    )
    .order("created_at", { ascending: true });

  if (error) {
    return Response.json({ ok: false, error: "Export failed." }, { status: 500 });
  }

  const headers = [
    "ticket_code", "name", "email", "phone", "address", "age_range", "gender",
    "occupation", "district", "verified", "verified_at", "ad_watched_at",
    "consent_at", "created_at",
  ];
  const rows = (data ?? []).map((e) => [
    e.ticket_code, e.name, e.email, e.phone, e.address, e.age_range, e.gender,
    e.occupation, e.district, e.verified, e.verified_at, e.ad_watched_at,
    e.consent_at, e.created_at,
  ]);

  await logAudit("export.entries", { count: rows.length }, session.sub);

  const stamp = new Date().toISOString().slice(0, 10);
  return csvResponse(`lilac-entries-${stamp}.csv`, toCsv(headers, rows));
}
