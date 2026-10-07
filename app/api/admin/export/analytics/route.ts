import { getAdminSession } from "@/lib/auth";
import { toCsvSections, csvResponse } from "@/lib/csv";
import { getSiteAnalytics } from "@/lib/analytics";

/** GET /api/admin/export/analytics — CSV: site-wide totals + per-ad breakdown. */
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return Response.json({ ok: false, error: "Not signed in." }, { status: 401 });
  if (session.role !== "admin") {
    return Response.json({ ok: false, error: "Not authorised." }, { status: 403 });
  }

  const data = await getSiteAnalytics();

  const siteRows = [
    ["Ad-flow sessions started", data.flowSessionsStarted],
    ["Sessions completed", data.flowSessionsCompleted],
    ["Verified entries", data.verifiedEntries],
    ["Ticket buyers", data.ticketBuyers],
  ];
  const adRows = data.perAd.map((a) => [a.title, a.kind, a.shown, a.watched, `${a.completionPct}%`]);

  const stamp = new Date().toISOString().slice(0, 10);
  const csv = toCsvSections([
    { headers: ["Site-wide metric", "Value"], rows: siteRows },
    { headers: ["Ad", "Kind", "Times shown", "Times watched", "Completion"], rows: adRows },
  ]);
  return csvResponse(`lailac-analytics-${stamp}.csv`, csv);
}
