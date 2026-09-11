import type { Metadata } from "next";
import Link from "next/link";
import { requireFullAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDrawUnlocked } from "@/lib/app-config";
import { getAvailability, getTicketSettings } from "@/lib/tickets";
import { formatLkr } from "@/lib/tickets-shared";
import { AdminShell } from "@/components/admin/AdminShell";
import { DrawLock } from "@/components/admin/DrawLock";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };
export const dynamic = "force-dynamic";

function pct(part: number, whole: number): string {
  if (whole <= 0) return "—";
  return `${Math.round((part / whole) * 100)}%`;
}

function tally(rows: Record<string, unknown>[], key: string, top = 8): [string, number][] {
  const m = new Map<string, number>();
  for (const r of rows) {
    const v = (r[key] as string | null) || "Not given";
    m.set(v, (m.get(v) ?? 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, top);
}

function Breakdown({ title, data }: { title: string; data: [string, number][] }) {
  const max = Math.max(1, ...data.map(([, n]) => n));
  return (
    <div className="rounded-card border border-hairline p-4">
      <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-ink-muted">
        {title}
      </h3>
      <ul className="mt-3 space-y-2">
        {data.length === 0 && (
          <li className="font-sans text-xs text-ink-muted">No data yet.</li>
        )}
        {data.map(([k, n]) => (
          <li key={k} className="font-sans text-xs">
            <div className="flex justify-between">
              <span className="text-ink">{k}</span>
              <span className="text-ink-muted">{n}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-pill bg-canvas-raised">
              <div
                className="h-full rounded-pill bg-accent/50"
                style={{ width: `${(n / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function AdminDashboard() {
  const session = await requireFullAdmin();
  const db = createAdminClient();
  const head = { count: "exact", head: true } as const;
  const nowMs = new Date().getTime();
  const dayAgo = new Date(nowMs - 24 * 3600_000).toISOString();
  const weekAgo = new Date(nowMs - 7 * 24 * 3600_000).toISOString();

  const [
    total,
    draws,
    winners,
    adViews,
    adCompletes,
    entries24h,
    entries7d,
    drawUnlocked,
    ticketsPending,
    ticketsIssued,
    ticketsCheckedIn,
    availability,
    settings,
    { data: entryRows },
    { data: approved },
  ] = await Promise.all([
    db.from("entries").select("*", head),
    db.from("draws").select("*", head),
    db.from("winners").select("*", head),
    db.from("events").select("*", head).eq("type", "ad_view"),
    db.from("events").select("*", head).eq("type", "ad_complete"),
    db.from("entries").select("id", head).gte("created_at", dayAgo),
    db.from("entries").select("id", head).gte("created_at", weekAgo),
    getDrawUnlocked(),
    db.from("ticket_purchases").select("id", head).eq("status", "pending_review"),
    db.from("tickets").select("id", head),
    db.from("tickets").select("id", head).not("checked_in_at", "is", null),
    getAvailability(),
    getTicketSettings(),
    db.from("entries").select("age_range, gender, district"),
    db.from("ticket_purchases").select("amount_lkr, quantity").eq("status", "approved"),
  ]);

  const totalC = total.count ?? 0;
  const viewsC = adViews.count ?? 0;
  const completesC = adCompletes.count ?? 0;
  const issuedC = ticketsIssued.count ?? 0;
  const checkedC = ticketsCheckedIn.count ?? 0;
  const revenue = (approved ?? []).reduce((n, p) => n + (p.amount_lkr ?? 0), 0);
  const buyers = (approved ?? []).length;
  const rows = (entryRows ?? []) as Record<string, unknown>[];

  const funnel = [
    { label: "Ad views", value: viewsC, sub: "opened the flow" },
    { label: "Ad completed", value: completesC, sub: `${pct(completesC, viewsC)} of views` },
    { label: "Entries", value: totalC, sub: `${pct(totalC, viewsC)} of views` },
  ];

  return (
    <AdminShell email={session.email}>
      <h1 className="text-2xl text-ink">Dashboard</h1>

      <h2 className="mt-6 font-sans text-sm font-semibold uppercase tracking-wider text-ink-muted">
        Raffle funnel
      </h2>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
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
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Entries last 24h", value: entries24h.count ?? 0 },
          { label: "Entries last 7d", value: entries7d.count ?? 0 },
          { label: "Draws run", value: draws.count ?? 0 },
          { label: "Winners", value: winners.count ?? 0 },
        ].map((s) => (
          <div key={s.label} className="rounded-card border border-hairline p-4">
            <div className="font-sans text-xl font-semibold text-ink">{s.value}</div>
            <div className="mt-1 font-sans text-xs text-ink-muted">{s.label}</div>
          </div>
        ))}
      </div>

      <h2 className="mt-8 font-sans text-sm font-semibold uppercase tracking-wider text-ink-muted">
        Entrant breakdown
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Breakdown title="District" data={tally(rows, "district")} />
        <Breakdown title="Age range" data={tally(rows, "age_range")} />
        <Breakdown title="Gender" data={tally(rows, "gender")} />
      </div>

      <h2 className="mt-8 font-sans text-sm font-semibold uppercase tracking-wider text-ink-muted">
        Ticket sales &amp; check-in
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Revenue (confirmed)", value: formatLkr(revenue), href: "/admin/tickets?status=approved" },
          {
            label: "Seats sold",
            value: `${availability.taken} / ${availability.capacity}`,
            sub: `${pct(availability.taken, availability.capacity)}${availability.salesOpen ? "" : " · closed"}`,
            href: "/admin/tickets",
          },
          { label: "Awaiting review", value: ticketsPending.count ?? 0, href: "/admin/tickets?status=pending_review" },
          {
            label: "Checked in",
            value: `${checkedC} / ${issuedC}`,
            sub: `${pct(checkedC, issuedC)} of issued`,
            href: "/admin/checkin",
          },
        ].map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-card border border-hairline p-4 transition-colors hover:border-accent"
          >
            <div className="font-sans text-lg font-semibold text-ink">{c.value}</div>
            <div className="mt-1 font-sans text-xs text-ink-muted">{c.label}</div>
            {c.sub && <div className="font-sans text-xs text-ink-muted">{c.sub}</div>}
          </Link>
        ))}
      </div>
      <p className="mt-2 font-sans text-xs text-ink-muted">
        {buyers} confirmed purchase{buyers === 1 ? "" : "s"} · {formatLkr(settings.priceLkr)} per
        ticket.
      </p>

      <h2 className="mt-8 font-sans text-sm font-semibold uppercase tracking-wider text-ink-muted">
        Winner draw
      </h2>
      <div className="mt-3">
        <DrawLock unlocked={drawUnlocked} variant="inline" />
      </div>

      <div className="mt-8 flex flex-wrap gap-3 font-sans text-sm">
        <Link
          href="/admin/entries"
          className="rounded-field border border-hairline px-4 py-2 text-accent-strong hover:border-accent"
        >
          Browse entries
        </Link>
        {drawUnlocked && (
          <Link
            href="/admin/draw"
            className="rounded-field border border-hairline px-4 py-2 text-accent-strong hover:border-accent"
          >
            Run a draw
          </Link>
        )}
        <Link
          href="/admin/tickets"
          className="rounded-field border border-hairline px-4 py-2 text-accent-strong hover:border-accent"
        >
          Tickets
        </Link>
        <Link
          href="/admin/export"
          className="rounded-field border border-hairline px-4 py-2 text-accent-strong hover:border-accent"
        >
          Export CSV
        </Link>
      </div>
    </AdminShell>
  );
}
