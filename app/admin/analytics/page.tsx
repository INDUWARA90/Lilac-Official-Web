import type { Metadata } from "next";
import { requireFullAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { getSiteAnalytics } from "@/lib/analytics";
import { CountUp } from "@/components/ui/decor/CountUp";

export const metadata: Metadata = { title: "Analytics", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const session = await requireFullAdmin();
  const data = await getSiteAnalytics();

  const siteStats = [
    { label: "Ad-flow sessions started", value: data.flowSessionsStarted },
    { label: "Sessions completed", value: data.flowSessionsCompleted },
    { label: "Verified entries", value: data.verifiedEntries },
    { label: "Ticket buyers", value: data.ticketBuyers },
  ];

  return (
    <AdminShell email={session.email}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl text-ink">Analytics</h1>
        <a
          href="/api/admin/export/analytics"
          className="rounded-field border border-hairline px-4 py-2 font-sans text-sm text-accent-strong hover:border-accent"
        >
          Export CSV
        </a>
      </div>
      <p className="mt-1 font-sans text-sm text-ink-muted">
        Site-wide interaction numbers, plus a per-ad breakdown you can hand to each sponsor —
        how many people saw their ad and how many watched it through.
      </p>

      <h2 className="mt-6 font-sans text-sm font-semibold uppercase tracking-wider text-ink-muted">
        Site-wide
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {siteStats.map((s, i) => (
          <div
            key={s.label}
            className="lilac-enter rounded-card border border-hairline p-4"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <div className="font-sans text-xl font-semibold text-ink">
              <CountUp value={s.value} />
            </div>
            <div className="mt-1 font-sans text-xs text-ink-muted">{s.label}</div>
          </div>
        ))}
      </div>

      <h2 className="mt-8 font-sans text-sm font-semibold uppercase tracking-wider text-ink-muted">
        Per-sponsor ad performance
      </h2>
      {data.perAd.length === 0 ? (
        <p className="mt-3 font-sans text-sm text-ink-muted">No ads configured yet.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse font-sans text-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-ink-muted">
                <th className="py-2 pr-4 font-medium">Ad</th>
                <th className="py-2 pr-4 font-medium">Kind</th>
                <th className="py-2 pr-4 font-medium">Shown</th>
                <th className="py-2 pr-4 font-medium">Watched</th>
                <th className="py-2 font-medium">Completion</th>
              </tr>
            </thead>
            <tbody className="lilac-rows">
              {data.perAd.map((a) => (
                <tr key={a.id} className="border-b border-hairline">
                  <td className="py-2 pr-4 text-ink">{a.title}</td>
                  <td className="py-2 pr-4 text-ink-muted">{a.kind}</td>
                  <td className="py-2 pr-4 text-ink-muted">{a.shown.toLocaleString()}</td>
                  <td className="py-2 pr-4 text-ink-muted">{a.watched.toLocaleString()}</td>
                  <td className="py-2 text-ink-muted">{a.completionPct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 font-sans text-xs text-ink-muted">
        &ldquo;Shown&rdquo; = the ad appeared in someone&rsquo;s flow. &ldquo;Watched&rdquo; = they
        satisfied its watch/view requirement and moved on (not necessarily that they finished the
        whole flow).
      </p>
    </AdminShell>
  );
}
