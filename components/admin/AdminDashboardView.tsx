import Link from "next/link";
import { CountUp } from "@/components/ui/decor/CountUp";
import { DrawLock } from "@/components/admin/DrawLock";
import { AdminShell } from "@/components/admin/AdminShell";

type BreakdownData = { title: string; data: [string, number][] };
type TicketCard = { label: string; value: string | number; sub?: string; href: string };

export function AdminDashboardView({
  email,
  funnel,
  summaryStats,
  breakdowns,
  ticketCards,
  buyers,
  seatingPrice,
  standingPrice,
  drawUnlocked,
}: {
  email: string;
  funnel: { label: string; value: number; sub: string }[];
  summaryStats: { label: string; value: number }[];
  breakdowns: BreakdownData[];
  ticketCards: TicketCard[];
  buyers: number;
  seatingPrice: string;
  standingPrice: string;
  drawUnlocked: boolean;
}) {
  return (
    <AdminShell email={email}>
      <h1 className="text-2xl text-ink">Dashboard</h1>

      <h2 className="mt-6 font-sans text-sm font-semibold uppercase tracking-wider text-ink-muted">
        Raffle funnel
      </h2>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {funnel.map((f, i) => (
          <div
            key={f.label}
            className="lailac-enter rounded-card border border-hairline p-4"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <div className="font-sans text-2xl font-semibold text-ink">
              <CountUp value={f.value} />
            </div>
            <div className="mt-1 font-sans text-xs font-medium text-ink">{f.label}</div>
            <div className="font-sans text-xs text-ink-muted">{f.sub}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {summaryStats.map((stat, i) => (
          <div
            key={stat.label}
            className="lailac-enter rounded-card border border-hairline p-4"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <div className="font-sans text-xl font-semibold text-ink">
              <CountUp value={stat.value} />
            </div>
            <div className="mt-1 font-sans text-xs text-ink-muted">{stat.label}</div>
          </div>
        ))}
      </div>

      <h2 className="mt-8 font-sans text-sm font-semibold uppercase tracking-wider text-ink-muted">
        Entrant breakdown
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {breakdowns.map((breakdown) => (
          <Breakdown key={breakdown.title} {...breakdown} />
        ))}
      </div>

      <h2 className="mt-8 font-sans text-sm font-semibold uppercase tracking-wider text-ink-muted">
        Ticket sales &amp; check-in
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ticketCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-card border border-hairline p-4 transition-colors hover:border-accent"
          >
            <div className="font-sans text-lg font-semibold text-ink">{card.value}</div>
            <div className="mt-1 font-sans text-xs text-ink-muted">{card.label}</div>
            {card.sub && <div className="font-sans text-xs text-ink-muted">{card.sub}</div>}
          </Link>
        ))}
      </div>
      <p className="mt-2 font-sans text-xs text-ink-muted">
        {buyers} confirmed purchase{buyers === 1 ? "" : "s"} · Seating {seatingPrice} /
        Standing {standingPrice}.
      </p>

      <h2 className="mt-8 font-sans text-sm font-semibold uppercase tracking-wider text-ink-muted">
        Winner draw
      </h2>
      <div className="mt-3">
        <DrawLock unlocked={drawUnlocked} variant="inline" />
      </div>

      <div className="mt-8 flex flex-wrap gap-3 font-sans text-sm">
        <DashboardLink href="/admin/entries">Browse entries</DashboardLink>
        {drawUnlocked && <DashboardLink href="/admin/draw">Run a draw</DashboardLink>}
        <DashboardLink href="/admin/tickets">Tickets</DashboardLink>
        <DashboardLink href="/admin/export">Export CSV</DashboardLink>
      </div>
    </AdminShell>
  );
}

function Breakdown({ title, data }: BreakdownData) {
  const max = Math.max(1, ...data.map(([, count]) => count));
  return (
    <div className="rounded-card border border-hairline p-4">
      <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-ink-muted">
        {title}
      </h3>
      <ul className="mt-3 space-y-2">
        {data.length === 0 && (
          <li className="font-sans text-xs text-ink-muted">No data yet.</li>
        )}
        {data.map(([label, count], index) => (
          <li key={label} className="font-sans text-xs">
            <div className="flex justify-between">
              <span className="text-ink">{label}</span>
              <span className="text-ink-muted">{count}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-pill bg-canvas-raised">
              <div
                className="lailac-bar-grow h-full rounded-pill bg-accent/50"
                style={{ width: `${(count / max) * 100}%`, "--bar-delay": `${index * 60}ms` } as React.CSSProperties}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DashboardLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-field border border-hairline px-4 py-2 text-accent-strong hover:border-accent"
    >
      {children}
    </Link>
  );
}
