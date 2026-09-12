import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAvailability, getTicketSettings } from "@/lib/tickets";
import { getDrawUnlocked } from "@/lib/app-config";
import { AdminShell } from "@/components/admin/AdminShell";
import { formatLkr, PURCHASE_STATUS_LABEL } from "@/lib/tickets-shared";
import { formatDate } from "@/lib/format";
import type { TicketPurchaseStatusDb } from "@/lib/supabase/types";

export const metadata: Metadata = { title: "Tickets", robots: { index: false } };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;
const STATUSES: TicketPurchaseStatusDb[] = [
  "pending_review",
  "approved",
  "rejected",
  "cancelled",
];

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const session = await requireAdmin();
  const sp = await searchParams;
  const status = STATUSES.includes(sp.status as TicketPurchaseStatusDb)
    ? (sp.status as TicketPurchaseStatusDb)
    : null;
  const page = Math.max(1, Number(sp.page) || 1);
  const from = (page - 1) * PAGE_SIZE;

  const db = createAdminClient();
  let query = db
    .from("ticket_purchases")
    .select("id, reference, name, email, phone, quantity, amount_lkr, status, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);

  const [{ data: rows, count }, availability, settings, { count: checkedIn }, { count: issued }] =
    await Promise.all([
      query.range(from, from + PAGE_SIZE - 1),
      getAvailability(),
      getTicketSettings(),
      db.from("tickets").select("id", { count: "exact", head: true }).not("checked_in_at", "is", null),
      db.from("tickets").select("id", { count: "exact", head: true }),
      getDrawUnlocked(), // warm the shared cache — AdminShell needs it too, see lib/app-config.ts
    ]);

  const total = count ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const link = (p: Record<string, string | number>) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    for (const [k, v] of Object.entries(p)) if (v && v !== 1) params.set(k, String(v));
    const s = params.toString();
    return s ? `/admin/tickets?${s}` : "/admin/tickets";
  };

  return (
    <AdminShell email={session.email} role={session.role}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl text-ink">Tickets</h1>
        {session.role === "admin" && (
          <Link
            href="/admin/tickets/settings"
            className="rounded-field border border-hairline px-3 py-1.5 font-sans text-sm text-accent-strong hover:border-accent"
          >
            Settings & bank details
          </Link>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Price", value: formatLkr(settings.priceLkr) },
          {
            label: "Seats",
            value: `${availability.taken} / ${availability.capacity}`,
            sub: availability.salesOpen ? `${availability.left} left` : "sales closed",
          },
          { label: "Tickets issued", value: issued ?? 0 },
          { label: "Checked in", value: `${checkedIn ?? 0} / ${issued ?? 0}` },
        ].map((c) => (
          <div key={c.label} className="rounded-card border border-hairline p-4">
            <div className="font-sans text-lg font-semibold text-ink">{c.value}</div>
            <div className="mt-1 font-sans text-xs text-ink-muted">{c.label}</div>
            {c.sub && <div className="font-sans text-xs text-ink-muted">{c.sub}</div>}
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-2 font-sans text-sm">
        <Link
          href="/admin/tickets"
          className={
            "rounded-field px-3 py-1 " +
            (!status ? "bg-accent-wash font-medium text-accent-strong" : "text-ink-muted")
          }
        >
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/tickets?status=${s}`}
            className={
              "rounded-field px-3 py-1 " +
              (status === s ? "bg-accent-wash font-medium text-accent-strong" : "text-ink-muted")
            }
          >
            {PURCHASE_STATUS_LABEL[s]}
          </Link>
        ))}
      </div>

      <p className="mt-4 font-sans text-xs text-ink-muted">
        {total.toLocaleString()} purchase{total === 1 ? "" : "s"} · page {page} of {lastPage}
      </p>

      <div className="mt-2 overflow-x-auto">
        <table className="w-full border-collapse font-sans text-sm">
          <thead>
            <tr className="border-b border-hairline text-left text-ink-muted">
              <th className="py-2 pr-4 font-medium">Reference</th>
              <th className="py-2 pr-4 font-medium">Name</th>
              <th className="py-2 pr-4 font-medium">Contact</th>
              <th className="py-2 pr-4 font-medium">Qty</th>
              <th className="py-2 pr-4 font-medium">Amount</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-ink-muted">
                  No purchases.
                </td>
              </tr>
            ) : (
              (rows ?? []).map((r) => (
                <tr key={r.id} className="border-b border-hairline align-top">
                  <td className="py-2 pr-4">
                    <Link
                      href={`/admin/tickets/${r.id}`}
                      className="font-mono text-xs text-accent-strong hover:underline"
                    >
                      {r.reference}
                    </Link>
                  </td>
                  <td className="py-2 pr-4">{r.name}</td>
                  <td className="py-2 pr-4 text-ink-muted">
                    {r.email}
                    <br />
                    {r.phone}
                  </td>
                  <td className="py-2 pr-4">{r.quantity}</td>
                  <td className="py-2 pr-4">{formatLkr(r.amount_lkr)}</td>
                  <td className="py-2 pr-4">{PURCHASE_STATUS_LABEL[r.status]}</td>
                  <td className="py-2 whitespace-nowrap text-ink-muted">
                    {formatDate(r.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex gap-3 font-sans text-sm">
        {page > 1 && (
          <Link href={link({ page: page - 1 })} className="text-accent-strong hover:underline">
            ← Previous
          </Link>
        )}
        {page < lastPage && (
          <Link href={link({ page: page + 1 })} className="text-accent-strong hover:underline">
            Next →
          </Link>
        )}
      </div>
    </AdminShell>
  );
}
