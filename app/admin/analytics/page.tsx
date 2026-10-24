import type { Metadata } from "next";
import { requireFullAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { getSiteAnalytics, getTshirtAnalytics, getTicketAnalytics, getTshirtHandoverAnalytics } from "@/lib/analytics";
import { AdPerformanceSection, SiteWideSection, TicketOrdersSection, TshirtHandoverSection, TshirtOrdersSection } from "@/components/admin/analytics/AnalyticsSections";

export const metadata: Metadata = { title: "Analytics · Admin Dashboard", robots: { index: false } };
export const dynamic = "force-dynamic";
const SECTIONS = ["site-wide", "ad-performance", "tshirt-orders", "tshirt-handover", "ticket-orders"] as const;
type AnalyticsSection = (typeof SECTIONS)[number];

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ section?: string }> }) {
  const [session, params] = await Promise.all([requireFullAdmin(), searchParams]);
  const section: AnalyticsSection = SECTIONS.includes(params.section as AnalyticsSection) ? params.section as AnalyticsSection : "site-wide";
  const [site, tshirts, handovers, tickets] = await Promise.all([getSiteAnalytics(), getTshirtAnalytics(), getTshirtHandoverAnalytics(), getTicketAnalytics()]);
  return <AdminShell email={session.email}><div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-5"><div><h1 className="font-serif text-3xl font-bold tracking-tight text-ink">Analytics &amp; Insights</h1><p className="mt-1 font-sans text-xs text-ink-muted">Choose a category from Analytics in the sidebar to view its detailed report.</p></div><a href={`/api/admin/export/analytics?section=${section}`} className="rounded-full border border-[#b79ddb]/40 bg-white/80 px-5 py-2.5 font-sans text-xs font-semibold text-[#7b539f] hover:border-[#7b539f] hover:bg-[#7b539f] hover:text-white">Export this section CSV</a></div>
    {section === "site-wide" && <SiteWideSection data={site} />}
    {section === "ad-performance" && <AdPerformanceSection data={site} />}
    {section === "tshirt-orders" && <TshirtOrdersSection result={tshirts} />}
    {section === "tshirt-handover" && <TshirtHandoverSection result={handovers} />}
    {section === "ticket-orders" && <TicketOrdersSection result={tickets} />}
  </div></AdminShell>;
}
