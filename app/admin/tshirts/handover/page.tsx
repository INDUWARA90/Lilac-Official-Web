import type { Metadata } from "next";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireTshirtAccess } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAll } from "@/lib/supabase/fetch-all";
import { TshirtHandoverButton } from "@/components/admin/TshirtHandoverButton";
import { formatLkr } from "@/lib/tickets-shared";
import { FACULTIES, TSHIRT_STATUS_LABEL } from "@/lib/tshirts-shared";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "T-shirt handover", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function TshirtHandoverPage({ searchParams }: { searchParams: Promise<{ q?: string; view?: string; faculty?: string }> }) {
  const session = await requireTshirtAccess();
  const params = await searchParams;
  const raw = params.q ?? "";
  const query = raw.trim().slice(0, 80).replace(/[^a-zA-Z0-9@._+\-/ ]/g, "");
  const view = params.view === "given" || params.view === "waiting" ? params.view : "all";
  const faculty = FACULTIES.includes(params.faculty as typeof FACULTIES[number])
    ? params.faculty as typeof FACULTIES[number]
    : "";
  let orders: Array<{ id: string; reference: string; name: string; email: string; registration_number: string; faculty: string; phone: string; tshirt_size: string; quantity: number; order_items: { size: string; color: string }[] | null; amount_lkr: number; paid_amount_lkr: number | null; status: "pending_review" | "partially_paid" | "payment_collected" | "rejected" | "cancelled"; review_note: string | null; collected_by: string | null; collected_at: string | null; created_at: string; handed_over: boolean; handed_over_at: string | null; handed_over_by: string | null }> = [];

  const db = createAdminClient();
  const { data: givenBalanceOrders } = await fetchAll((from, to) => {
    let balanceQuery = db
      .from("tshirt_orders")
      .select("quantity, amount_lkr, paid_amount_lkr")
      .eq("handed_over", true)
      .order("id")
      .range(from, to);
    if (faculty) balanceQuery = balanceQuery.eq("faculty", faculty);
    if (query) {
      const term = `%${query}%`;
      balanceQuery = balanceQuery.or(`reference.ilike.${term},name.ilike.${term},email.ilike.${term},registration_number.ilike.${term}`);
    }
    return balanceQuery;
  });
  if (query) {
    const term = `%${query}%`;
    let searchQuery = db
      .from("tshirt_orders")
      .select("id, reference, name, email, registration_number, faculty, phone, tshirt_size, quantity, order_items, amount_lkr, paid_amount_lkr, status, review_note, collected_by, collected_at, created_at, handed_over, handed_over_at, handed_over_by")
      .or(`reference.ilike.${term},name.ilike.${term},email.ilike.${term},registration_number.ilike.${term}`)
      .order(view === "given" ? "handed_over_at" : "created_at", { ascending: view !== "given" })
      .limit(20);
    if (view === "waiting") searchQuery = searchQuery.eq("handed_over", false);
    if (view === "given") searchQuery = searchQuery.eq("handed_over", true);
    if (faculty) searchQuery = searchQuery.eq("faculty", faculty);
    const { data } = await searchQuery;
    orders = data ?? [];
  } else {
    let waitingQuery = db.from("tshirt_orders")
      .select("id, reference, name, email, registration_number, faculty, phone, tshirt_size, quantity, order_items, amount_lkr, paid_amount_lkr, status, review_note, collected_by, collected_at, created_at, handed_over, handed_over_at, handed_over_by")
      .order(view === "given" ? "handed_over_at" : "created_at", { ascending: view !== "given" }).limit(100);
    if (view === "waiting") waitingQuery = waitingQuery.eq("handed_over", false);
    if (view === "given") waitingQuery = waitingQuery.eq("handed_over", true);
    if (faculty) waitingQuery = waitingQuery.eq("faculty", faculty);
    const { data } = await waitingQuery;
    orders = data ?? [];
  }
  // Payment status is not used here. Fully paid orders are ignored; every
  // other handed-over order contributes only its remaining balance.
  const balanceCollectionOrders = givenBalanceOrders.filter(
    (order) => Math.max(0, order.amount_lkr - (order.paid_amount_lkr ?? 0)) > 0,
  );
  const givenShirts = givenBalanceOrders.reduce((total, order) => total + order.quantity, 0);
  const givenRemainingBalance = balanceCollectionOrders.reduce(
    (total, order) => total + Math.max(0, order.amount_lkr - (order.paid_amount_lkr ?? 0)),
    0,
  );
  return (
    <AdminShell email={session.email} role={session.role}>
      <Link href="/admin/tshirts" className="font-sans text-sm text-accent-strong hover:underline">← T-shirt orders</Link>
      <h1 className="mt-3 text-2xl text-ink">T-shirt handover</h1>
      <p className="mt-1 font-sans text-sm text-ink-muted">Find an order by buyer name, email, registration number, or order reference before handing over shirts.</p>
      <a href="/api/admin/export/tshirt-handovers" className="mt-4 inline-block rounded-field border border-hairline px-3 py-1.5 font-sans text-sm text-accent-strong hover:border-accent">Download handover CSV</a>

      <div className="mt-5 flex flex-wrap gap-2 font-sans text-sm">
        {[{ key: "all", label: "All orders" }, { key: "given", label: "Given" }, { key: "waiting", label: "Not given" }].map((option) => {
          const href = `/admin/tshirts/handover?view=${option.key}${query ? `&q=${encodeURIComponent(query)}` : ""}${faculty ? `&faculty=${encodeURIComponent(faculty)}` : ""}`;
          return <Link key={option.key} href={href} className={"rounded-field px-3 py-1.5 " + (view === option.key ? "bg-accent-wash font-medium text-accent-strong" : "text-ink-muted hover:bg-canvas-raised")}>{option.label}</Link>;
        })}
      </div>

      {view === "given" && (
        <div className="mt-5 grid max-w-xl grid-cols-2 gap-3">
          <div className="rounded-card border border-hairline p-4"><p className="font-sans text-lg font-semibold text-ink">{givenShirts}</p><p className="mt-1 font-sans text-xs text-ink-muted">T-shirts given</p></div>
          <div className="rounded-card border border-hairline p-4"><p className="font-sans text-lg font-semibold text-ink">{formatLkr(givenRemainingBalance)}</p><p className="mt-1 font-sans text-xs text-ink-muted">Balance collected at handover</p><p className="mt-1 font-sans text-[11px] text-ink-muted">Only positive remaining balances; fully paid orders are ignored.</p></div>
        </div>
      )}

      <form className="mt-5 flex max-w-3xl flex-wrap gap-2" action="/admin/tshirts/handover">
        <input type="hidden" name="view" value={view} />
        <input name="q" defaultValue={query} placeholder="Name, email, registration number, or reference" className="min-w-0 flex-1 rounded-field border border-hairline bg-transparent px-3 py-2 font-sans text-sm text-ink focus:border-accent focus:outline-none" />
        <select name="faculty" defaultValue={faculty} className="rounded-field border border-hairline bg-transparent px-3 py-2 font-sans text-sm text-ink focus:border-accent focus:outline-none"><option value="">All faculties</option>{FACULTIES.map((name) => <option key={name} value={name}>{name}</option>)}</select>
        <button className="rounded-field bg-accent px-4 py-2 font-sans text-sm font-medium text-white hover:bg-accent-strong">Find</button>
        {(query || faculty || view !== "all") && <Link href="/admin/tshirts/handover" className="rounded-field border border-hairline px-4 py-2 font-sans text-sm text-ink-muted hover:border-accent hover:text-accent-strong">Clear</Link>}
      </form>

      {orders.length === 0 ? <p className="mt-8 font-sans text-sm text-ink-muted">{query ? `No T-shirt order matches “${query}”.` : view === "given" ? "No T-shirts have been given yet." : view === "all" ? "No T-shirt orders found." : "No T-shirt orders are waiting for handover."}</p> : <div className="mt-6 grid gap-4 lg:grid-cols-2">{orders.map((order) => {
        const paid = order.paid_amount_lkr ?? 0;
        const balance = order.paid_amount_lkr === null ? null : Math.max(0, order.amount_lkr - order.paid_amount_lkr);
        return <article key={order.id} className="rounded-card border border-hairline p-5">
          <div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="font-sans font-semibold text-ink">{order.name}</h2><p className="mt-1 font-mono text-xs text-ink-muted">{order.reference}</p></div><span className={order.handed_over ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700" : "rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700"}>{order.handed_over ? "Given" : "Not given"}</span></div>
          <div className="mt-4 space-y-1 font-sans text-sm text-ink-muted"><p>{order.email}</p><p>{order.phone}</p><p>{order.registration_number} · {order.faculty}</p><p>Ordered: {formatDateTime(order.created_at)}</p></div>
          <div className="mt-4 rounded-field bg-canvas-raised p-3 font-sans text-sm text-ink"><p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Give these shirts</p>{order.order_items?.length ? <ul className="mt-2 space-y-1">{order.order_items.map((item, index) => <li key={index}>{index + 1}. {item.color} · Size {item.size}</li>)}</ul> : <p className="mt-2">{order.quantity} × Size {order.tshirt_size}</p>}</div>
          <div className="mt-3 rounded-field border border-hairline p-3 font-sans text-sm"><p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Payment information</p><p className="mt-2 text-ink">{TSHIRT_STATUS_LABEL[order.status]}</p><p className="text-ink-muted">Paid: {order.paid_amount_lkr === null ? "Not recorded" : formatLkr(paid)} / {formatLkr(order.amount_lkr)}</p><p className="text-ink-muted">Balance: {balance === null ? "Unknown" : formatLkr(balance)}</p>{order.review_note && <p className="mt-2 text-ink-muted">Note: {order.review_note}</p>}{order.collected_by && <p className="mt-2 text-xs text-ink-muted">Payment confirmed by {order.collected_by}{order.collected_at ? ` on ${formatDateTime(order.collected_at)}` : ""}</p>}</div>
          <TshirtHandoverButton orderId={order.id} handedOver={order.handed_over} />
          {order.handed_over && <p className="mt-3 font-sans text-sm font-medium text-emerald-700">Already given{order.handed_over_by ? ` by ${order.handed_over_by}` : ""}{order.handed_over_at ? ` on ${formatDateTime(order.handed_over_at)}` : ""}</p>}
          <Link href={`/admin/tshirts/${order.id}`} className="mt-4 inline-block font-sans text-sm text-accent-strong hover:underline">Open order details →</Link>
        </article>;
      })}</div>}
    </AdminShell>
  );
}
