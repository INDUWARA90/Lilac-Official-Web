import type { Metadata } from "next";
import Link from "next/link";
import { requireTshirtAccess } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { TshirtOrderFilters } from "@/components/admin/TshirtOrderFilters";
import { TSHIRT_ORDER_STATUS, TSHIRT_STATUS_LABEL, type TshirtOrderStatus } from "@/lib/tshirts-shared";
import { formatLkr } from "@/lib/tickets-shared";
import { formatDate } from "@/lib/format";
export const metadata: Metadata = { title: "T-shirt orders", robots: { index: false } };
export const dynamic = "force-dynamic";

type SearchParams = { q?: string; status?: string };

export default async function AdminTshirts({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await requireTshirtAccess();
  const params = await searchParams;
  const search = (params.q ?? "").trim().slice(0, 80).replace(/[^a-zA-Z0-9@._+\-/ ]/g, "");
  const status = TSHIRT_ORDER_STATUS.includes(params.status as TshirtOrderStatus)
    ? params.status as TshirtOrderStatus
    : "";

  const db = createAdminClient();
  let query = db
    .from("tshirt_orders")
    .select("id, reference, name, registration_number, faculty, tshirt_size, quantity, order_items, amount_lkr, status, created_at")
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  if (search) {
    const term = `%${search}%`;
    query = query.or(
      `reference.ilike.${term},name.ilike.${term},registration_number.ilike.${term},email.ilike.${term}`,
    );
  }
  const orderResult = await query;

  const [{ data: sales, error: salesError }, { count: awaiting, error: awaitingError }] = await Promise.all([
    db.from("tshirt_orders").select("quantity, amount_lkr").eq("status", "payment_collected"),
    db.from("tshirt_orders").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
  ]);
  const loadError = orderResult.error ?? salesError ?? awaitingError;

  const shirtsSold = (sales ?? []).reduce((sum, order) => sum + order.quantity, 0);
  const revenue = (sales ?? []).reduce((sum, order) => sum + order.amount_lkr, 0);
  return (
    <AdminShell email={session.email} role={session.role}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl text-ink">T-shirt orders</h1>
          <p className="mt-2 font-sans text-sm text-ink-muted">Review receipts and record payments collected manually.</p>
        </div>
        {session.role !== "ticket_manager" && (
          <a href="/api/admin/export/tshirts" className="rounded-field border border-hairline px-3 py-1.5 font-sans text-sm text-accent-strong hover:border-accent">
            Export CSV
          </a>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Summary label="Revenue collected" value={loadError ? "—" : formatLkr(revenue)} />
        <Summary label="T-shirts sold" value={loadError ? "—" : String(shirtsSold)} />
        <Summary label="Paid orders" value={loadError ? "—" : String(sales?.length ?? 0)} />
        <Summary label="Awaiting review" value={loadError ? "—" : String(awaiting ?? 0)} />
      </div>

      <TshirtOrderFilters
        key={`${search}|${status}`}
        initialQuery={search}
        initialStatus={status}
        statuses={TSHIRT_ORDER_STATUS.map((value) => ({ value, label: TSHIRT_STATUS_LABEL[value] }))}
      />

      <div className="mt-5 overflow-x-auto">
        {loadError && (
          <p role="alert" className="mb-4 rounded-field border border-red-200 bg-red-50 p-3 font-sans text-sm text-red-700">
            Could not load T-shirt data{loadError.message ? `: ${loadError.message}` : "."}
          </p>
        )}
        <table className="w-full border-collapse font-sans text-sm">
          <thead>
            <tr className="border-b border-hairline text-left text-ink-muted">
              <th className="py-2 pr-3">Reference</th>
              <th className="py-2 pr-3">Buyer</th>
              <th className="py-2 pr-3">Registration / Faculty</th>
              <th className="py-2 pr-3">Shirts</th>
              <th className="py-2 pr-3">Amount</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {(orderResult.data ?? []).map((order) => (
              <tr key={order.id} className="border-b border-hairline">
                <td className="py-2 pr-3"><Link href={`/admin/tshirts/${order.id}`} className="font-mono text-xs text-accent-strong hover:underline">{order.reference}</Link></td>
                <td className="py-2 pr-3">{order.name}</td>
                <td className="py-2 pr-3 text-ink-muted">{order.registration_number}<br />{order.faculty}</td>
                <td className="py-2 pr-3">{order.order_items?.length ? order.order_items.map((item, index) => <div key={index}>{item.color} / {item.size}</div>) : `${order.tshirt_size} / ${order.quantity}`}</td>
                <td className="py-2 pr-3">{formatLkr(order.amount_lkr)}</td>
                <td className="py-2 pr-3">{TSHIRT_STATUS_LABEL[order.status]}</td>
                <td className="py-2 text-ink-muted">{formatDate(order.created_at)}</td>
              </tr>
            ))}
            {!orderResult.data?.length && !loadError && <tr><td colSpan={7} className="py-6 text-center text-ink-muted">No matching T-shirt orders.</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="rounded-card border border-hairline p-4"><p className="font-sans text-lg font-semibold text-ink">{value}</p><p className="mt-1 font-sans text-xs text-ink-muted">{label}</p></div>;
}
