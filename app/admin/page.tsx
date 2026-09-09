import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };
export const dynamic = "force-dynamic";

function pct(part: number, whole: number): string {
  if (whole <= 0) return "—";
  return `${Math.round((part / whole) * 100)}%`;
}

export default async function AdminDashboard() {
  const session = await requireAdmin();
  const db = createAdminClient();

  const head = { count: "exact", head: true } as const;
  const [total, verified, draws, winners, adViews, adCompletes] =
    await Promise.all([
      db.from("entries").select("*", head),
      db.from("entries").select("*", head).eq("verified", true),
      db.from("draws").select("*", head),
      db.from("winners").select("*", head),
      db.from("events").select("*", head).eq("type", "ad_view"),
      db.from("events").select("*", head).eq("type", "ad_complete"),
    ]);

  const totalC = total.count ?? 0;
  const verifiedC = verified.count ?? 0;
  const viewsC = adViews.count ?? 0;
  const completesC = adCompletes.count ?? 0;

  const funnel = [
    { label: "Ad views", value: viewsC, sub: "people who opened the flow" },
    { label: "Ad completed", value: completesC, sub: pct(completesC, viewsC) + " of views" },
    { label: "Entries submitted", value: totalC, sub: pct(totalC, viewsC) + " of views" },
    { label: "Verified entries", value: verifiedC, sub: pct(verifiedC, totalC) + " of entries" },
  ];

  const stats = [
    { label: "Unverified", value: totalC - verifiedC },
    { label: "Draws run", value: draws.count ?? 0 },
    { label: "Winners", value: winners.count ?? 0 },
  ];

  return (
    <AdminShell email={session.email}>
      <h1 className="text-2xl text-ink">Dashboard</h1>

      <h2 className="mt-6 font-sans text-sm font-semibold uppercase tracking-wider text-ink-muted">
        Funnel
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {funnel.map((f) => (
          <div key={f.label} className="rounded-card border border-hairline p-4">
            <div className="font-sans text-2xl font-semibold text-ink">
              {f.value.toLocaleString()}
            </div>
            <div className="mt-1 font-sans text-xs font-medium text-ink">{f.label}</div>
            <div className="font-sans text-xs text-ink-muted">{f.sub}</div>
          </div>
        ))}
      </div>

      <h2 className="mt-8 font-sans text-sm font-semibold uppercase tracking-wider text-ink-muted">
        Other
      </h2>
      <div className="mt-3 grid grid-cols-3 gap-3 sm:max-w-md">
        {stats.map((s) => (
          <div key={s.label} className="rounded-card border border-hairline p-4">
            <div className="font-sans text-2xl font-semibold text-ink">{s.value}</div>
            <div className="mt-1 font-sans text-xs text-ink-muted">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3 font-sans text-sm">
        <Link href="/admin/entries" className="rounded-field border border-hairline px-4 py-2 text-accent-strong hover:border-accent">
          Browse entries
        </Link>
        <Link href="/admin/draw" className="rounded-field border border-hairline px-4 py-2 text-accent-strong hover:border-accent">
          Run a draw
        </Link>
        <Link href="/admin/winners" className="rounded-field border border-hairline px-4 py-2 text-accent-strong hover:border-accent">
          View winners
        </Link>
        <Link href="/admin/export" className="rounded-field border border-hairline px-4 py-2 text-accent-strong hover:border-accent">
          Export CSV
        </Link>
      </div>
    </AdminShell>
  );
}
