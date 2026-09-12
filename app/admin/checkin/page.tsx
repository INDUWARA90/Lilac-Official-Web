import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDrawUnlocked } from "@/lib/app-config";
import { AdminShell } from "@/components/admin/AdminShell";
import { TicketCheckinToggle } from "@/components/admin/TicketCheckinToggle";
import { formatTimeAndDate } from "@/lib/format";

export const metadata: Metadata = { title: "Check-in", robots: { index: false } };
export const dynamic = "force-dynamic";

type Filter = "all" | "in" | "out";

export default async function AdminCheckinPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; f?: string }>;
}) {
  const session = await requireAdmin();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 80);
  const filter: Filter = sp.f === "in" ? "in" : sp.f === "out" ? "out" : "all";

  const db = createAdminClient();
  const [{ data: tickets }, { data: purchases }] = await Promise.all([
    db
      .from("tickets")
      .select("id, token, seat_label, holder_name, checked_in_at, checked_in_by, purchase_id")
      .order("created_at", { ascending: true }),
    db.from("ticket_purchases").select("id, reference, email, phone").eq("status", "approved"),
    getDrawUnlocked(), // warm the shared cache — AdminShell needs it too, see lib/app-config.ts
  ]);

  const byId = new Map((purchases ?? []).map((p) => [p.id, p]));
  let rows = (tickets ?? []).map((t) => ({ ...t, purchase: byId.get(t.purchase_id) }));

  const ql = q.toLowerCase();
  if (q) {
    rows = rows.filter(
      (r) =>
        r.holder_name.toLowerCase().includes(ql) ||
        (r.purchase?.reference ?? "").toLowerCase().includes(ql) ||
        (r.purchase?.email ?? "").toLowerCase().includes(ql) ||
        (r.purchase?.phone ?? "").includes(q),
    );
  }
  const total = rows.length;
  const inCount = rows.filter((r) => r.checked_in_at).length;
  if (filter === "in") rows = rows.filter((r) => r.checked_in_at);
  if (filter === "out") rows = rows.filter((r) => !r.checked_in_at);

  const tab = (f: Filter, label: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (f !== "all") params.set("f", f);
    const href = params.toString() ? `/admin/checkin?${params}` : "/admin/checkin";
    return (
      <Link
        key={f}
        href={href}
        className={
          "rounded-field px-3 py-1 font-sans text-sm " +
          (filter === f ? "bg-accent-wash font-medium text-accent-strong" : "text-ink-muted")
        }
      >
        {label}
      </Link>
    );
  };

  return (
    <AdminShell email={session.email} role={session.role}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl text-ink">Check-in</h1>
        <Link
          href="/checkin"
          target="_blank"
          className="rounded-field border border-hairline px-3 py-1.5 font-sans text-sm text-accent-strong hover:border-accent"
        >
          Open scanner ↗
        </Link>
      </div>
      <p className="mt-1 font-sans text-sm text-ink-muted">
        Every issued ticket. Door staff normally scan the QR, but you can check anyone in by
        hand here.
      </p>

      <div className="mt-4 grid grid-cols-3 gap-3 sm:max-w-md">
        {[
          { label: "Issued", value: (tickets ?? []).length },
          { label: "Checked in", value: inCount },
          { label: "Not yet", value: (tickets ?? []).length - inCount },
        ].map((c) => (
          <div key={c.label} className="rounded-card border border-hairline p-4">
            <div className="font-sans text-2xl font-semibold text-ink">{c.value}</div>
            <div className="mt-1 font-sans text-xs text-ink-muted">{c.label}</div>
          </div>
        ))}
      </div>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 font-sans text-xs text-ink-muted">
          Search name, reference, email, phone
          <input
            name="q"
            defaultValue={q}
            className="w-64 rounded-field border border-hairline bg-transparent px-3 py-1.5 text-sm text-ink focus:border-accent focus:outline-none"
          />
        </label>
        {filter !== "all" && <input type="hidden" name="f" value={filter} />}
        <button
          type="submit"
          className="rounded-field border border-hairline px-4 py-1.5 font-sans text-sm font-medium text-accent-strong hover:border-accent"
        >
          Search
        </button>
        {q && (
          <Link href="/admin/checkin" className="font-sans text-xs text-ink-muted underline">
            Clear
          </Link>
        )}
      </form>

      <div className="mt-4 flex gap-2">
        {tab("all", `All (${total})`)}
        {tab("out", "Not checked in")}
        {tab("in", "Checked in")}
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-collapse font-sans text-sm">
          <thead>
            <tr className="border-b border-hairline text-left text-ink-muted">
              <th className="py-2 pr-4 font-medium">Name</th>
              <th className="py-2 pr-4 font-medium">Reference</th>
              <th className="py-2 pr-4 font-medium">Seat</th>
              <th className="py-2 pr-4 font-medium">Checked in</th>
              <th className="py-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-ink-muted">
                  {(tickets ?? []).length === 0
                    ? "No tickets issued yet."
                    : "No tickets match."}
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-hairline align-top">
                  <td className="py-2 pr-4">{r.holder_name}</td>
                  <td className="py-2 pr-4">
                    <Link
                      href={`/admin/tickets/${r.purchase_id}`}
                      className="font-mono text-xs text-accent-strong hover:underline"
                    >
                      {r.purchase?.reference ?? "—"}
                    </Link>
                  </td>
                  <td className="py-2 pr-4 text-ink-muted">{r.seat_label}</td>
                  <td className="py-2 pr-4 text-ink-muted">
                    {r.checked_in_at ? (
                      <>
                        {formatTimeAndDate(r.checked_in_at)}
                        {r.checked_in_by && (
                          <span className="block text-xs">by {r.checked_in_by}</span>
                        )}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-2">
                    <TicketCheckinToggle
                      token={r.token}
                      checkedIn={Boolean(r.checked_in_at)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
