import type { Metadata } from "next";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireTshirtAccess } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { FACULTIES, TSHIRT_STATUS_LABEL } from "@/lib/tshirts-shared";
import { formatDate } from "@/lib/format";
import { formatLkr } from "@/lib/tickets-shared";

export const metadata: Metadata = { title: "Previous T-shirt orders", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PreviousTshirtOrders({ searchParams }: { searchParams: Promise<{ q?: string; faculty?: string }> }) {
  const [session, params] = await Promise.all([requireTshirtAccess(), searchParams]);
  const search = (params.q ?? "").trim().slice(0, 80).replace(/[^a-zA-Z0-9@._+\-/ ]/g, "");
  const faculty = FACULTIES.includes(params.faculty as (typeof FACULTIES)[number]) ? params.faculty as string : "";
  const db = createAdminClient();
  let query = db.from("tshirt_orders")
    .select("id, reference, name, registration_number, faculty, tshirt_size, quantity, order_items, amount_lkr, paid_amount_lkr, status, created_at")
    .order("created_at", { ascending: false })
    .limit(250);
  if (faculty) query = query.eq("faculty", faculty);
  if (search) {
    const term = `%${search}%`;
    query = query.or(`reference.ilike.${term},name.ilike.${term},registration_number.ilike.${term},email.ilike.${term}`);
  }
  const { data: orders, error } = await query;

  return <AdminShell email={session.email} role={session.role}>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl text-ink">Previous T-shirt orders</h1><p className="mt-2 font-sans text-sm text-ink-muted">Existing orders are shown separately and are never mixed with new requests.</p></div><Link href="/admin/tshirts" className="rounded-field border border-hairline px-3 py-1.5 font-sans text-sm text-accent-strong hover:border-accent">View new orders</Link></div>
    <form className="mt-5 flex flex-wrap gap-2" action="/admin/tshirts/previous"><input name="q" defaultValue={search} placeholder="Name, email, registration, reference" className="min-w-0 flex-1 rounded-field border border-hairline bg-transparent px-3 py-2 font-sans text-sm text-ink" /><select name="faculty" defaultValue={faculty} className="rounded-field border border-hairline bg-transparent px-3 py-2 font-sans text-sm text-ink"><option value="">All faculties</option>{FACULTIES.map((name) => <option key={name} value={name}>{name}</option>)}</select><button className="rounded-field bg-accent px-4 py-2 font-sans text-sm font-medium text-white">Find</button>{(search || faculty) && <Link href="/admin/tshirts/previous" className="rounded-field border border-hairline px-4 py-2 font-sans text-sm text-ink-muted">Clear</Link>}</form>
    {error ? <p role="alert" className="mt-5 rounded-field border border-red-200 bg-red-50 p-3 font-sans text-sm text-red-700">Could not load previous orders{error.message ? `: ${error.message}` : "."}</p> : <div className="mt-5 overflow-x-auto"><table className="w-full border-collapse font-sans text-sm"><thead><tr className="border-b border-hairline text-left text-ink-muted"><th className="py-2 pr-3">Reference</th><th className="py-2 pr-3">Buyer</th><th className="py-2 pr-3">Registration / Faculty</th><th className="py-2 pr-3">Shirts</th><th className="py-2 pr-3">Paid / total</th><th className="py-2 pr-3">Status</th><th className="py-2">Date</th></tr></thead><tbody>{(orders ?? []).map((order) => <tr key={order.id} className="border-b border-hairline"><td className="py-2 pr-3"><Link href={`/admin/tshirts/previous/${order.id}`} className="font-mono text-xs text-accent-strong hover:underline">{order.reference}</Link></td><td className="py-2 pr-3">{order.name}</td><td className="py-2 pr-3 text-ink-muted">{order.registration_number}<br />{order.faculty}</td><td className="py-2 pr-3">{order.order_items?.length ? order.order_items.map((item, index) => <div key={index}>{item.color} / {item.size}</div>) : `${order.tshirt_size} / ${order.quantity}`}</td><td className="py-2 pr-3">{order.paid_amount_lkr === null ? "Not recorded" : formatLkr(order.paid_amount_lkr)} / {formatLkr(order.amount_lkr)}</td><td className="py-2 pr-3">{TSHIRT_STATUS_LABEL[order.status]}</td><td className="py-2 text-ink-muted">{formatDate(order.created_at)}</td></tr>)}{!orders?.length && <tr><td colSpan={7} className="py-6 text-center text-ink-muted">No previous T-shirt orders found.</td></tr>}</tbody></table></div>}
  </AdminShell>;
}
