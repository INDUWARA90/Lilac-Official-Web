import { getAdminSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { toCsv, csvResponse } from "@/lib/csv";
import { fetchAll } from "@/lib/supabase/fetch-all";

/** GET /api/admin/export/entries — CSV of every entry. */
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return Response.json({ ok: false, error: "Not signed in." }, { status: 401 });
  if (session.role !== "admin") {
    return Response.json({ ok: false, error: "Not authorised." }, { status: 403 });
  }

  const db = createAdminClient();
  const { data, error } = await fetchAll((from, to) =>
    db
      .from("entries")
      .select(
        "name, email, phone, address, age_range, gender, occupation, district, ad_watched_at, consent_at, created_at",
      )
      .order("created_at", { ascending: true })
      .order("id")
      .range(from, to),
  );

  if (error) {
    return Response.json({ ok: false, error: "Export failed." }, { status: 500 });
  }

  const headers = [
    "name", "email", "phone", "address", "age_range", "gender",
    "occupation", "district", "ad_watched_at", "consent_at", "created_at",
  ];
  const rows = (data ?? []).map((e) => [
    e.name, e.email, e.phone, e.address, e.age_range, e.gender,
    e.occupation, e.district, e.ad_watched_at, e.consent_at, e.created_at,
  ]);

  const stamp = new Date().toISOString().slice(0, 10);
  return csvResponse(`lailac-entries-${stamp}.csv`, toCsv(headers, rows));
}
