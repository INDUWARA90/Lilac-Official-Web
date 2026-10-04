import type { Metadata } from "next";
import { requireFullAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDrawUnlocked } from "@/lib/app-config";
import { getAvailability, getTicketSettings } from "@/lib/tickets";
import { fetchAll } from "@/lib/supabase/fetch-all";
import { formatLkr } from "@/lib/tickets-shared";
import { AdminDashboardView } from "@/components/admin/AdminDashboardView";

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
    fetchAll((from, to) =>
      db.from("entries").select("age_range, gender, district").order("id").range(from, to),
    ),
    fetchAll((from, to) =>
      db
        .from("ticket_purchases")
        .select("amount_lkr, quantity")
        .eq("status", "approved")
        .order("id")
        .range(from, to),
    ),
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
    <AdminDashboardView
      email={session.email}
      funnel={funnel}
      summaryStats={[
        { label: "Entries last 24h", value: entries24h.count ?? 0 },
        { label: "Entries last 7d", value: entries7d.count ?? 0 },
        { label: "Draws run", value: draws.count ?? 0 },
        { label: "Winners", value: winners.count ?? 0 },
      ]}
      breakdowns={[
        { title: "District", data: tally(rows, "district") },
        { title: "Age range", data: tally(rows, "age_range") },
        { title: "Gender", data: tally(rows, "gender") },
      ]}
      ticketCards={[
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
      ]}
      buyers={buyers}
      seatingPrice={formatLkr(settings.seatingPriceLkr)}
      standingPrice={formatLkr(settings.standingPriceLkr)}
      drawUnlocked={drawUnlocked}
    />
  );
}
