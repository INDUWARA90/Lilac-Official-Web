import type { Metadata } from "next";
import Link from "next/link";
import { requireTshirtAccess } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { TSHIRT_COLORS, TSHIRT_ORDER_STATUS, TSHIRT_SIZES, TSHIRT_STATUS_LABEL, type TshirtOrderStatus } from "@/lib/tshirts-shared";
import { formatLkr } from "@/lib/tickets-shared";
import { formatDate } from "@/lib/format";
export const metadata: Metadata = { title: "T-shirt orders", robots: { index: false } };
export const dynamic = "force-dynamic";

type SearchParams = { q?: string; size?: string; color?: string; status?: string };

export default async function AdminTshirts({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await requireTshirtAccess();
  const params = await searchParams;
  const search = (params.q ?? "").trim().slice(0, 80).replace(/[^a-zA-Z0-9@._+\- ]/g, "");
  const size = TSHIRT_SIZES.find((value) => value === params.size) ?? "";
  const color = TSHIRT_COLORS.find((value) => value === params.color) ?? "";
  const status = TSHIRT_ORDER_STATUS.includes(params.status as TshirtOrderStatus)
    ? params.status as TshirtOrderStatus
    : "";

  const db = createAdminClient();
  let query = db
    .from("tshirt_orders")
    .select("id, reference, name, registration_number, faculty, tshirt_size, quantity, order_items, amount_lkr, status, created_at")
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  if (size) {
    query = query.or(`order_items.cs.[{"size":"${size}"}],and(order_items.is.null,tshirt_size.eq.${size})`);
  }
  if (color) query = query.contains("order_items", [{ color }]);
  if (search) {
    const term = `%${search}%`;
    query = query.or(
      `reference.ilike.${term},name.ilike.${term},registration_number.ilike.${term},email.ilike.${term}`,
    );
  }

  const [{ data: rows, error }, { data: sales }, { count: awaiting }] = await Promise.all([
    query,
    db.from("tshirt_orders").select("quantity, amount_lkr").eq("status", "payment_collected"),
    db.from("tshirt_orders").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
  ]);
  if (error) throw new Error("Could not load T-shirt orders.");

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
        <Summary label="Revenue collected" value={formatLkr(revenue)} />
        <Summary label="T-shirts sold" value={String(shirtsSold)} />
        <Summary label="Paid orders" value={String(sales?.length ?? 0)} />
        <Summary label="Awaiting review" value={String(awaiting ?? 0)} />
      </div>

      <form action="/admin/tshirts" method="get" className="mt-5 grid gap-3 rounded-card border border-hairline p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="font-sans text-xs font-medium text-ink-muted">
          Search buyer / reference
          <input name="q" defaultValue={search} placeholder="Name, email, registration, reference" className="mt-1 block min-h-10 w-full rounded-field border border-hairline bg-canvas px-3 text-sm text-ink" />
        </label>
        <FilterSelect name="size" label="T-shirt size" value={size} options={TSHIRT_SIZES} />
        <FilterSelect name="color" label="Color" value={color} options={TSHIRT_COLORS} />
        <FilterSelect name="status" label="Order status" value={status} options={TSHIRT_ORDER_STATUS.map((value) => value)} labels={TSHIRT_STATUS_LABEL} />
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
          <button type="submit" className="min-h-10 rounded-field bg-accent px-4 font-sans text-sm font-semibold text-white hover:bg-accent-strong">Search / filter</button>
          <Link href="/admin/tshirts" className="inline-flex min-h-10 items-center rounded-field border border-hairline px-4 font-sans text-sm text-ink-muted hover:border-accent">Clear</Link>
        </div>
      </form>

      <div className="mt-5 overflow-x-auto">
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
            {(rows ?? []).map((order) => (
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
            {!rows?.length && <tr><td colSpan={7} className="py-6 text-center text-ink-muted">No matching T-shirt orders.</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="rounded-card border border-hairline p-4"><p className="font-sans text-lg font-semibold text-ink">{value}</p><p className="mt-1 font-sans text-xs text-ink-muted">{label}</p></div>;
}

function FilterSelect({
  name,
  label,
  value,
  options,
  labels,
}: {
  name: string;
  label: string;
  value: string;
  options: readonly string[];
  labels?: Record<string, string>;
}) {
  return (
    <label className="font-sans text-xs font-medium text-ink-muted">
      {label}
      <select name={name} defaultValue={value} className="mt-1 block min-h-10 w-full rounded-field border border-hairline bg-canvas px-3 text-sm text-ink">
        <option value="">All</option>
        {options.map((option) => <option key={option} value={option}>{labels?.[option] ?? option}</option>)}
      </select>
    </label>
  );
}
