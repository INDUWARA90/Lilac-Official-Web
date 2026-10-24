import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireTshirtAccess } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { formatLkr } from "@/lib/tickets-shared";
import { createAdminClient } from "@/lib/supabase/admin";
import { TSHIRT_STATUS_LABEL } from "@/lib/tshirts-shared";
import { tshirtReceiptUrl } from "@/lib/tshirts";

export const dynamic = "force-dynamic";

export default async function PreviousTshirtOrder({ params }: { params: Promise<{ id: string }> }) {
  const [session, { id }] = await Promise.all([requireTshirtAccess(), params]);
  const { data: order } = await createAdminClient().from("tshirt_orders").select("*").eq("id", id).maybeSingle();
  if (!order) notFound();
  const receiptUrl = await tshirtReceiptUrl(order.receipt_path);
  return <AdminShell email={session.email} role={session.role}><Link href="/admin/tshirts/previous" className="font-sans text-sm text-accent-strong hover:underline">← Previous T-shirt orders</Link><h1 className="mt-3 text-2xl text-ink">{order.reference}</h1><p className="mt-1 font-sans text-sm text-ink-muted">{TSHIRT_STATUS_LABEL[order.status]} · {formatDateTime(order.created_at)}</p><div className="mt-6 grid gap-6 md:grid-cols-2"><section className="rounded-card border border-hairline p-4 font-sans text-sm"><h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Buyer details</h2><p className="mt-3 text-ink">{order.name}</p><p className="text-ink-muted">{order.registration_number} · {order.faculty}</p><p className="mt-2 text-ink-muted">{order.email}<br />{order.phone}</p><p className="mt-3 text-ink">Quantity: <strong>{order.quantity}</strong></p><p className="text-ink-muted">Paid: {order.paid_amount_lkr === null ? "Not recorded" : formatLkr(order.paid_amount_lkr)} / {formatLkr(order.amount_lkr)}</p><p className="text-ink-muted">Balance: {order.paid_amount_lkr === null ? "Unknown" : formatLkr(Math.max(0, order.amount_lkr - order.paid_amount_lkr))}</p><div className="mt-3"><h3 className="font-semibold text-ink">Shirts</h3>{order.order_items?.length ? <ul className="mt-1 list-inside list-disc text-ink-muted">{order.order_items.map((item, index) => <li key={index}>{item.color} · Size {item.size}</li>)}</ul> : <p className="text-ink-muted">Size {order.tshirt_size}</p>}</div></section><section className="rounded-card border border-hairline p-4"><h2 className="font-sans text-xs font-semibold uppercase tracking-wider text-ink-muted">Payment receipt</h2>{receiptUrl ? <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm text-accent-strong underline">Open receipt</a> : <p className="mt-3 text-sm text-red-600">Receipt file not found.</p>}</section></div><p className="mt-6 rounded-field bg-canvas-raised p-3 font-sans text-xs text-ink-muted">Previous orders are read-only here. No old order data is changed.</p></AdminShell>;
}
