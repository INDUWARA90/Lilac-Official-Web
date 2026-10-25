import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAvailability, getTicketSettings } from "@/lib/tickets";
import { getDrawUnlocked } from "@/lib/app-config";
import { AdminShell } from "@/components/admin/AdminShell";
import { TicketBackupButton } from "@/components/admin/TicketBackupButton";
import { MarkTicketEmailSentButton } from "@/components/admin/MarkTicketEmailSentButton";
import { TicketEmailDeliveryFilter } from "@/components/admin/TicketEmailDeliveryFilter";
import {
  formatLkr,
  formatTicketTypeBreakdown,
  PURCHASE_STATUS_LABEL,
} from "@/lib/tickets-shared";
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
const EMAIL_DELIVERY_FILTERS = ["not_queued", "pending", "sending", "sent", "failed"] as const;
type EmailDeliveryFilter = (typeof EMAIL_DELIVERY_FILTERS)[number];

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; q?: string; faculty?: string; email?: string }>;
}) {
  const session = await requireAdmin();
  const sp = await searchParams;
  const status = STATUSES.includes(sp.status as TicketPurchaseStatusDb)
    ? (sp.status as TicketPurchaseStatusDb)
    : null;
  const search = (sp.q ?? "").trim().slice(0, 100);
  const faculty = (sp.faculty ?? "").trim().slice(0, 150);
  const emailFilter = EMAIL_DELIVERY_FILTERS.includes(sp.email as EmailDeliveryFilter)
    ? (sp.email as EmailDeliveryFilter)
    : null;
  const page = Math.max(1, Number(sp.page) || 1);
  const from = (page - 1) * PAGE_SIZE;

  const db = createAdminClient();
  let query = db
    .from("ticket_purchases")
    .select("id, reference, name, registration_number, faculty, email, phone, ticket_type, ticket_types, quantity, amount_lkr, status, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  if (faculty) query = query.eq("faculty", faculty);
  if (search) {
    const term = search.replace(/[,.()]/g, " ").replace(/%/g, "").trim();
    if (term) {
      const pattern = `%${term}%`;
      query = query.or(`reference.ilike.${pattern},name.ilike.${pattern},registration_number.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern}`);
    }
  }

  const [
    ticketResult,
    availability,
    settings,
    { count: checkedIn },
  ] =
    await Promise.all([
      emailFilter ? query.range(0, 9_999) : query.range(from, from + PAGE_SIZE - 1),
      getAvailability(),
      getTicketSettings(),
      db.from("tickets").select("id", { count: "exact", head: true }).not("checked_in_at", "is", null),
      getDrawUnlocked(), // warm the shared cache — AdminShell needs it too, see lib/app-config.ts
    ]);

  const allRows = ticketResult.data ?? [];
  const { data: facultyRows } = await db
    .from("ticket_purchases")
    .select("faculty")
    .not("faculty", "is", null)
    .order("faculty");
  const { data: emailDeliveries } = allRows.length
    ? await db
        .from("ticket_email_deliveries")
        .select("purchase_id, status, sent_at, last_error")
        .range(0, 9_999)
    : { data: [] };
  const emailByPurchase = new Map((emailDeliveries ?? []).map((delivery) => [delivery.purchase_id, delivery]));

  const matchingRows = emailFilter
    ? allRows.filter((row) => {
        const delivery = emailByPurchase.get(row.id);
        return emailFilter === "not_queued" ? !delivery : delivery?.status === emailFilter;
      })
    : allRows;
  const rows = emailFilter ? matchingRows.slice(from, from + PAGE_SIZE) : matchingRows;
  const count = emailFilter ? matchingRows.length : ticketResult.count;

  const total = count ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const faculties = [
    ...new Set(
      (facultyRows ?? [])
        .map((row) => row.faculty)
        .filter((value): value is string => Boolean(value)),
    ),
  ];
  const link = (p: Record<string, string | number>) => {
    const params = new URLSearchParams();
    const nextStatus = "status" in p ? String(p.status) : status;
    if (nextStatus) params.set("status", nextStatus);
    if (search) params.set("q", search);
    if (faculty) params.set("faculty", faculty);
    const nextEmail = "email" in p ? String(p.email) : emailFilter;
    if (nextEmail) params.set("email", nextEmail);
    for (const [k, v] of Object.entries(p)) if (v && v !== 1) params.set(k, String(v));
    const s = params.toString();
    return s ? `/admin/tickets?${s}` : "/admin/tickets";
  };

  return (
    <AdminShell email={session.email} role={session.role}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl text-ink">Tickets</h1>
        <div className="flex flex-wrap items-start gap-2">
          {session.role === "admin" && (
            <a
              href="/api/admin/export/tickets"
              className="rounded-field border border-hairline px-3 py-1.5 font-sans text-sm text-accent-strong hover:border-accent"
            >
              Export tickets CSV
            </a>
          )}
          <TicketBackupButton />
          {session.role === "admin" && (
            <Link
              href="/admin/tickets/settings"
              className="rounded-field border border-hairline px-3 py-1.5 font-sans text-sm text-accent-strong hover:border-accent"
            >
              Settings & bank details
            </Link>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {[
          {
            label: "Seating / Standing",
            value: `${formatLkr(settings.seatingPriceLkr)} / ${formatLkr(settings.standingPriceLkr)}`,
          },
          {
            label: "Seating sold / capacity",
            value: `${availability.seating.taken} / ${availability.seating.capacity}`,
            sub: availability.salesOpen ? `${availability.seating.left} left` : "sales closed",
          },
          {
            label: "Standing sold / capacity",
            value: `${availability.standing.taken} / ${availability.standing.capacity}`,
            sub: availability.salesOpen ? `${availability.standing.left} left` : "sales closed",
          },
          { label: "Checked in", value: checkedIn ?? 0 },
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
          href={link({ status: "" })}
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
            href={link({ status: s })}
            className={
              "rounded-field px-3 py-1 " +
              (status === s ? "bg-accent-wash font-medium text-accent-strong" : "text-ink-muted")
            }
          >
            {PURCHASE_STATUS_LABEL[s]}
          </Link>
        ))}
      </div>

      <form className="mt-4 flex flex-wrap items-end gap-3 rounded-card border border-hairline p-4 font-sans">
        {status && <input type="hidden" name="status" value={status} />}
        <label className="flex min-w-56 flex-1 flex-col gap-1 text-xs font-medium text-ink-muted">
          Search tickets
          <input
            name="q"
            defaultValue={search}
            placeholder="Name, reference, registration no., email or phone"
            className="rounded-field border border-hairline bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          />
        </label>
        <label className="flex min-w-48 flex-col gap-1 text-xs font-medium text-ink-muted">
          Faculty
          <select
            name="faculty"
            defaultValue={faculty}
            className="rounded-field border border-hairline bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          >
            <option value="">All faculties</option>
            {faculties.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="flex min-w-40 flex-col gap-1 text-xs font-medium text-ink-muted">
          Email delivery
          <TicketEmailDeliveryFilter value={emailFilter ?? ""} />
        </label>
        <button type="submit" className="rounded-field bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-strong">
          Find
        </button>
        {(search || faculty || emailFilter) && (
          <Link href={status ? `/admin/tickets?status=${status}` : "/admin/tickets"} className="px-2 py-2 text-sm text-accent-strong hover:underline">
            Clear
          </Link>
        )}
      </form>

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
              <th className="py-2 pr-4 font-medium">Type</th>
              <th className="py-2 pr-4 font-medium">Qty</th>
              <th className="py-2 pr-4 font-medium">Amount</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 pr-4 font-medium">Email</th>
              <th className="py-2 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="lailac-rows">
            {(rows ?? []).length === 0 ? (
              <tr>
                <td colSpan={9} className="py-6 text-center text-ink-muted">
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
                  <td className="py-2 pr-4">
                    {r.name}
                    <div className="mt-1 text-xs text-ink-muted">
                      Reg: {r.registration_number}
                      {r.faculty ? ` · ${r.faculty}` : ""}
                    </div>
                  </td>
                  <td className="py-2 pr-4 text-ink-muted">
                    {r.email}
                    <br />
                    {r.phone}
                  </td>
                  <td className="py-2 pr-4">{formatTicketTypeBreakdown(r.ticket_types)}</td>
                  <td className="py-2 pr-4">{r.quantity}</td>
                  <td className="py-2 pr-4">{formatLkr(r.amount_lkr)}</td>
                  <td className="py-2 pr-4">{PURCHASE_STATUS_LABEL[r.status]}</td>
                  <td className="py-2 pr-4">
                    <EmailDeliveryBadge delivery={emailByPurchase.get(r.id)} approved={r.status === "approved"} purchaseId={r.id} />
                  </td>
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

function EmailDeliveryBadge({
  delivery,
  approved,
  purchaseId,
}: {
  delivery: { status: "pending" | "sending" | "sent" | "failed"; sent_at: string | null; last_error: string | null } | undefined;
  approved: boolean;
  purchaseId: string;
}) {
  if (!approved) return <span className="text-ink-muted">—</span>;
  if (!delivery) {
    return (
      <span className="text-amber-700">
        Not queued
        <MarkTicketEmailSentButton purchaseId={purchaseId} />
      </span>
    );
  }
  const style = delivery.status === "sent" ? "text-emerald-700" : delivery.status === "failed" ? "text-red-700" : "text-amber-700";
  const label = delivery.status === "sent" ? "Sent" : delivery.status === "failed" ? "Failed" : delivery.status === "sending" ? "Sending" : "Queued";
  return (
    <span className={style} title={delivery.last_error ?? delivery.sent_at ?? undefined}>
      {label}
      {delivery.status !== "sent" && <MarkTicketEmailSentButton purchaseId={purchaseId} />}
    </span>
  );
}
