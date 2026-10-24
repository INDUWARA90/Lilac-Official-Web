import { CountUp } from "@/components/ui/decor/CountUp";
import type { SiteAnalytics, TicketAnalyticsResult, TshirtAnalyticsResult, TshirtHandoverAnalyticsResult } from "@/lib/analytics";
import { TSHIRT_COLORS, TSHIRT_SIZES } from "@/lib/tshirts-shared";

export function SiteWideSection({ data }: { data: SiteAnalytics }) {
  const stats = [
    ["Ad-flow sessions started", data.flowSessionsStarted], ["Sessions completed", data.flowSessionsCompleted],
    ["Verified entries", data.verifiedEntries], ["Ticket buyers", data.ticketBuyers],
  ] as const;
  return <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">{stats.map(([label, value], index) => <Summary key={label} label={label} value={value} highlight={index > 1} />)}</section>;
}

export function AdPerformanceSection({ data }: { data: SiteAnalytics }) {
  return <section className="rounded-3xl border border-hairline bg-surface p-6 shadow-xs">
    <h2 className="font-serif text-xl font-bold text-ink">Sponsor Ad Performance</h2>
    <p className="mt-1 font-sans text-xs text-ink-muted">“Shown” indicates impressions in the user flow. “Watched” confirms the ad requirement was completed.</p>
    {data.perAd.length === 0 ? <p className="py-8 text-center font-sans text-sm text-ink-muted">No sponsor ads configured yet.</p> : <div className="mt-6 overflow-x-auto"><table className="w-full border-collapse font-sans text-sm"><thead><tr className="border-b border-hairline text-left text-xs uppercase tracking-wider text-ink-muted"><th className="py-3 pr-4">Ad campaign</th><th className="py-3 pr-4">Kind</th><th className="py-3 pr-4">Shown</th><th className="py-3 pr-4">Watched</th><th className="py-3">Completion</th></tr></thead><tbody className="divide-y divide-hairline">{data.perAd.map((ad) => <tr key={ad.id} className="hover:bg-canvas-raised/50"><td className="py-3 pr-4 font-medium text-ink">{ad.title}</td><td className="py-3 pr-4 text-ink-muted">{ad.kind}</td><td className="py-3 pr-4 font-mono text-ink-muted">{ad.shown}</td><td className="py-3 pr-4 font-mono text-ink-muted">{ad.watched}</td><td className="py-3"><Completion value={ad.completionPct} /></td></tr>)}</tbody></table></div>}
  </section>;
}

export function TshirtOrdersSection({ result }: { result: TshirtAnalyticsResult }) {
  if (!result.ok) return <ErrorMessage message={`Could not load T-shirt analytics: ${result.error}`} />;
  const { data } = result;
  return <section className="space-y-6">
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6"><Summary label="Orders submitted" value={data.submittedOrders} /><Summary label="Active orders" value={data.activeOrders} /><Summary label="Active shirts" value={data.orderedShirts} highlight /><Summary label="Paid shirts" value={data.shirtsWithPayment} highlight /><Summary label="Awaiting review" value={data.awaitingReview} /><Summary label="Rejected / cancelled" value={data.rejectedOrCancelled} /></div>
    <div className="grid gap-4 sm:grid-cols-3"><Insight label="Most requested size" value={topEntry(data.sizeColor.map((row) => [row.size, row.total] as const))} /><Insight label="Most requested color" value={topEntry(TSHIRT_COLORS.map((color) => [color, data.sizeColor.reduce((total, row) => total + row.colors[color], 0)] as const))} /><Insight label="Highest-demand faculty" value={topEntry(data.byFaculty.map((row) => [row.faculty, row.shirts] as const))} /></div>
    <section className="rounded-3xl border border-hairline bg-surface p-6 shadow-xs"><h3 className="font-serif text-lg font-bold text-ink">Total demand by size and color</h3><div className="mt-4 overflow-x-auto"><table className="w-full border-collapse font-sans text-sm"><thead><tr className="border-b border-hairline text-left text-xs uppercase tracking-wider text-ink-muted"><th className="py-3 pr-4">Size</th>{TSHIRT_COLORS.map((color) => <th key={color} className="py-3 pr-4">{color}</th>)}<th className="py-3">Total</th></tr></thead><tbody className="divide-y divide-hairline">{data.sizeColor.map((row) => <tr key={row.size}><td className="py-3 pr-4 font-semibold text-ink">{row.size}</td>{TSHIRT_COLORS.map((color) => <td key={color} className="py-3 pr-4 font-mono text-ink-muted">{row.colors[color]}</td>)}<td className="py-3 font-mono font-bold text-[#7b539f]">{row.total}</td></tr>)}</tbody></table></div></section>
    <section className="rounded-3xl border border-hairline bg-surface p-6 shadow-xs"><h3 className="font-serif text-lg font-bold text-ink">T-shirt demand by faculty</h3><p className="mt-1 font-sans text-xs text-ink-muted">White and Black quantities are separated by size in every faculty card.</p>{data.byFaculty.length === 0 ? <p className="py-6 text-center font-sans text-sm text-ink-muted">No active T-shirt orders yet.</p> : <div className="mt-5 grid gap-4 xl:grid-cols-2">{data.byFaculty.map((row) => <FacultyShirtCard key={row.faculty} row={row} />)}</div>}</section>
  </section>;
}

export function TshirtHandoverSection({ result }: { result: TshirtHandoverAnalyticsResult }) {
  if (!result.ok) return <ErrorMessage message={`Could not load T-shirt handover analytics: ${result.error}. Apply migration 0028_tshirt_handover.sql if it has not been applied yet.`} />;
  const { data } = result;
  return <section className="space-y-6">
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Summary label="Active orders" value={data.activeOrders} />
      <Summary label="Shirts to hand over" value={data.shirts} />
      <Summary label="Given" value={data.givenShirts} highlight />
      <Summary label="Not given" value={data.notGivenShirts} />
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <Insight label="Most collected size" value={topEntry(data.bySize.map((row) => [row.size, row.given] as const))} />
      <Insight label="Most remaining size" value={topEntry(data.bySize.map((row) => [row.size, row.notGiven] as const))} />
    </div>
    <section className="rounded-3xl border border-hairline bg-surface p-6 shadow-xs">
      <h3 className="font-serif text-lg font-bold text-ink">Collection by size</h3>
      <p className="mt-1 font-sans text-xs text-ink-muted">Counts come from the physical handover status, independently of payment status.</p>
      <div className="mt-4 overflow-x-auto"><table className="w-full border-collapse font-sans text-sm"><thead><tr className="border-b border-hairline text-left text-xs uppercase tracking-wider text-ink-muted"><th className="py-3 pr-4">Size</th><th className="py-3 pr-4">Total</th><th className="py-3 pr-4">Given</th><th className="py-3">Not given</th></tr></thead><tbody className="divide-y divide-hairline">{data.bySize.map((row) => <tr key={row.size}><td className="py-3 pr-4 font-semibold text-ink">{row.size}</td><td className="py-3 pr-4 font-mono text-ink-muted">{row.shirts}</td><td className="py-3 pr-4 font-mono font-bold text-[#7b539f]">{row.given}</td><td className="py-3 font-mono text-ink-muted">{row.notGiven}</td></tr>)}</tbody></table></div>
    </section>
    <section className="rounded-3xl border border-hairline bg-surface p-6 shadow-xs">
      <h3 className="font-serif text-lg font-bold text-ink">Collection by faculty</h3>
      {data.byFaculty.length === 0 ? <p className="py-6 text-center font-sans text-sm text-ink-muted">No active T-shirt orders yet.</p> : <div className="mt-4 overflow-x-auto"><table className="w-full border-collapse font-sans text-sm"><thead><tr className="border-b border-hairline text-left text-xs uppercase tracking-wider text-ink-muted"><th className="py-3 pr-4">Faculty</th><th className="py-3 pr-4">Orders</th><th className="py-3 pr-4">Shirts</th><th className="py-3 pr-4">Given</th><th className="py-3">Not given</th></tr></thead><tbody className="divide-y divide-hairline">{data.byFaculty.map((row) => <tr key={row.faculty}><td className="py-3 pr-4 font-medium text-ink">{row.faculty}</td><td className="py-3 pr-4 font-mono text-ink-muted">{row.orders}</td><td className="py-3 pr-4 font-mono text-ink-muted">{row.shirts}</td><td className="py-3 pr-4 font-mono font-bold text-[#7b539f]">{row.given}</td><td className="py-3 font-mono text-ink-muted">{row.notGiven}</td></tr>)}</tbody></table></div>}
    </section>
  </section>;
}

export function TicketOrdersSection({ result }: { result: TicketAnalyticsResult }) {
  if (!result.ok) return <ErrorMessage message={`Could not load ticket analytics: ${result.error}`} />;
  const { data } = result;
  return <section className="space-y-6"><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6"><Summary label="Orders submitted" value={data.submittedOrders} /><Summary label="Active orders" value={data.activeOrders} /><Summary label="Tickets requested" value={data.ticketsRequested} highlight /><Summary label="Tickets approved" value={data.ticketsApproved} highlight /><Summary label="Awaiting review" value={data.awaitingReview} /><Summary label="Rejected / cancelled" value={data.rejectedOrCancelled} /></div><div className="grid gap-4 sm:grid-cols-2"><Insight label="Most requested ticket type" value={topEntry(data.byType.map((row) => [row.type, row.requested] as const))} /><Insight label="Highest-demand faculty" value={topEntry(data.byFaculty.map((row) => [row.faculty, row.tickets] as const))} /></div><section className="rounded-3xl border border-hairline bg-surface p-6 shadow-xs"><h3 className="font-serif text-lg font-bold text-ink">Tickets by type</h3><div className="mt-4 overflow-x-auto"><table className="w-full border-collapse font-sans text-sm"><thead><tr className="border-b border-hairline text-left text-xs uppercase tracking-wider text-ink-muted"><th className="py-3 pr-4">Type</th><th className="py-3 pr-4">Requested</th><th className="py-3">Approved</th></tr></thead><tbody className="divide-y divide-hairline">{data.byType.map((row) => <tr key={row.type}><td className="py-3 pr-4 font-medium text-ink">{row.type}</td><td className="py-3 pr-4 font-mono text-ink-muted">{row.requested}</td><td className="py-3 font-mono font-bold text-[#7b539f]">{row.approved}</td></tr>)}</tbody></table></div></section><section className="rounded-3xl border border-hairline bg-surface p-6 shadow-xs"><h3 className="font-serif text-lg font-bold text-ink">Ticket demand by faculty</h3><p className="mt-1 font-sans text-xs text-ink-muted">Seating and standing requests, with confirmed quantities, per faculty.</p><div className="mt-4 overflow-x-auto"><table className="w-full border-collapse font-sans text-sm"><thead><tr className="border-b border-hairline text-left text-xs uppercase tracking-wider text-ink-muted"><th className="py-3 pr-4">Faculty</th><th className="py-3 pr-4">Orders</th><th className="py-3 pr-4">Seating</th><th className="py-3 pr-4">Seating approved</th><th className="py-3 pr-4">Standing</th><th className="py-3">Standing approved</th></tr></thead><tbody className="divide-y divide-hairline">{data.byFaculty.map((row) => <tr key={row.faculty}><td className="py-3 pr-4 font-medium text-ink">{row.faculty}</td><td className="py-3 pr-4 font-mono text-ink-muted">{row.orders}</td><td className="py-3 pr-4 font-mono text-ink-muted">{row.seatingRequested}</td><td className="py-3 pr-4 font-mono text-ink-muted">{row.seatingApproved}</td><td className="py-3 pr-4 font-mono text-ink-muted">{row.standingRequested}</td><td className="py-3 font-mono text-ink-muted">{row.standingApproved}</td></tr>)}</tbody></table></div></section></section>;
}

function Summary({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) { return <div className={`rounded-2xl border p-4 shadow-xs ${highlight ? "border-[#b79ddb]/50 bg-[#fcf9ff]" : "border-hairline bg-surface"}`}><div className="font-sans text-2xl font-bold text-ink"><CountUp value={value} /></div><div className="mt-1 font-sans text-xs font-medium text-ink-muted">{label}</div></div>; }
function Insight({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-[#b79ddb]/30 bg-[#fcf9ff] p-5 shadow-xs"><div className="font-serif text-lg font-bold text-[#7b539f]">{value}</div><div className="mt-1 font-sans text-xs font-medium text-ink-muted">{label}</div></div>; }
function ErrorMessage({ message }: { message: string }) { return <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 font-sans text-sm text-red-700">{message}</p>; }
function Completion({ value }: { value: number }) { return <div className="flex items-center gap-2"><div className="h-2 w-20 overflow-hidden rounded-full bg-canvas-raised"><div className="h-full rounded-full bg-[#7b539f]" style={{ width: `${Math.min(value, 100)}%` }} /></div><span className="font-mono text-xs text-ink">{value}%</span></div>; }
type FacultyShirtRow = {
  faculty: string; orders: number; shirts: number; shirtsWithPayment: number;
  colorSizes: Record<string, Record<string, number>>;
};
function FacultyShirtCard({ row }: { row: FacultyShirtRow }) { return <article className="overflow-hidden rounded-2xl border border-hairline bg-white"><div className="border-b border-hairline bg-[#fcf9ff] p-4"><h4 className="font-sans text-sm font-semibold text-ink">{row.faculty}</h4><p className="mt-1 font-sans text-xs text-ink-muted">{row.orders} orders · {row.shirts} shirts · {row.shirtsWithPayment} paid</p></div><div className="grid divide-x divide-hairline sm:grid-cols-2">{TSHIRT_COLORS.map((color) => <div key={color} className="p-4"><p className="font-sans text-xs font-semibold uppercase tracking-wider text-ink-muted">{color}</p><div className="mt-3 grid grid-cols-4 gap-2">{TSHIRT_SIZES.map((size) => <div key={size} className="rounded-lg bg-canvas-raised py-2 text-center"><div className="font-mono font-bold text-ink">{row.colorSizes[color][size]}</div><div className="text-[10px] text-ink-muted">{size}</div></div>)}</div></div>)}</div></article>; }
function topEntry(entries: ReadonlyArray<readonly [string, number]>) { const top = entries.reduce<readonly [string, number] | null>((current, entry) => !current || entry[1] > current[1] ? entry : current, null); return top && top[1] > 0 ? `${top[0]} (${top[1]})` : "No orders yet"; }
