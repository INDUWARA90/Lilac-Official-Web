import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDrawUnlocked } from "@/lib/app-config";
import { AdminShell } from "@/components/admin/AdminShell";
import { TicketCheckinToggle } from "@/components/admin/TicketCheckinToggle";
import { formatTimeAndDate } from "@/lib/format";
import { fetchAll } from "@/lib/supabase/fetch-all";

export const metadata: Metadata = { title: "Check-in", robots: { index: false } };
export const dynamic = "force-dynamic";

type Filter = "all" | "in" | "out";

export default async function AdminCheckinPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; f?: string; faculty?: string }>;
}) {
  const session = await requireAdmin();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 80);
  const filter: Filter = sp.f === "in" ? "in" : sp.f === "out" ? "out" : "all";
  const facultyFilter = (sp.faculty ?? "").trim().slice(0, 150);

  const db = createAdminClient();
  const [{ data: tickets }, { data: purchases }] = await Promise.all([
    fetchAll((from, to) =>
      db
        .from("tickets")
        .select("id, token, seat_label, holder_name, checked_in_at, checked_in_by, purchase_id")
        .order("created_at", { ascending: true })
        .order("id")
        .range(from, to),
    ),
    fetchAll((from, to) =>
      db
        .from("ticket_purchases")
        .select("id, name, reference, registration_number, faculty, email, phone")
        .eq("status", "approved")
        .order("id")
        .range(from, to),
    ),
    getDrawUnlocked(), // warm the shared cache — AdminShell needs it too, see lib/app-config.ts
  ]);

  const byId = new Map((purchases ?? []).map((p) => [p.id, p]));
  let rows = (tickets ?? []).map((t) => ({ ...t, purchase: byId.get(t.purchase_id) }));

  const normalize = (value: string | null | undefined) => (value ?? "").trim().toLowerCase();
  const ql = normalize(q);
  const phoneQuery = q.replace(/\D/g, "");
  if (q) {
    rows = rows.filter(
      (r) =>
        normalize(r.holder_name).includes(ql) ||
        normalize(r.purchase?.name).includes(ql) ||
        normalize(r.purchase?.reference).includes(ql) ||
        normalize(r.purchase?.registration_number).includes(ql) ||
        normalize(r.purchase?.faculty).includes(ql) ||
        normalize(r.purchase?.email).includes(ql) ||
        (phoneQuery.length > 0 && (r.purchase?.phone ?? "").replace(/\D/g, "").includes(phoneQuery)),
    );
  }
  if (facultyFilter) rows = rows.filter((r) => r.purchase?.faculty === facultyFilter);
  const total = rows.length;
  const inCount = rows.filter((r) => r.checked_in_at).length;
  const outCount = total - inCount;
  if (filter === "in") rows = rows.filter((r) => r.checked_in_at);
  if (filter === "out") rows = rows.filter((r) => !r.checked_in_at);

  const faculties = [...new Set((purchases ?? []).map((p) => p.faculty).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b));

  const tab = (f: Filter, label: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (facultyFilter) params.set("faculty", facultyFilter);
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
        hand here. Use “Undo check-in” to correct a mistaken check-in.
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
          Search name, registration number, faculty, reference, email or phone
          <input
            name="q"
            defaultValue={q}
            className="w-64 rounded-field border border-hairline bg-transparent px-3 py-1.5 text-sm text-ink focus:border-accent focus:outline-none"
          />
        </label>
        <label className="flex min-w-52 flex-col gap-1 font-sans text-xs text-ink-muted">
          Faculty
          <select name="faculty" defaultValue={facultyFilter} className="rounded-field border border-hairline bg-transparent px-3 py-1.5 text-sm text-ink focus:border-accent focus:outline-none">
            <option value="">All faculties</option>
            {faculties.map((faculty) => <option key={faculty} value={faculty}>{faculty}</option>)}
          </select>
        </label>
        {filter !== "all" && <input type="hidden" name="f" value={filter} />}
        <button
          type="submit"
          className="rounded-field border border-hairline px-4 py-1.5 font-sans text-sm font-medium text-accent-strong hover:border-accent"
        >
          Search
        </button>
        {(q || facultyFilter) && (
          <Link
            href="/admin/checkin"
            className="rounded-field border border-hairline px-4 py-2 font-sans text-sm font-medium text-ink-muted hover:border-accent hover:text-accent-strong"
          >
            Clear
          </Link>
        )}
      </form>

      <div className="mt-4 flex gap-2">
        {tab("all", `All (${total})`)}
        {tab("out", `Not checked in (${outCount})`)}
        {tab("in", `Checked in (${inCount})`)}
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-collapse font-sans text-sm">
          <thead>
            <tr className="border-b border-hairline text-left text-ink-muted">
              <th className="py-2 pr-4 font-medium">Name</th>
              <th className="py-2 pr-4 font-medium">Registration no.</th>
              <th className="py-2 pr-4 font-medium">Faculty</th>
              <th className="py-2 pr-4 font-medium">Reference</th>
              <th className="py-2 pr-4 font-medium">Seat</th>
              <th className="py-2 pr-4 font-medium">Checked in</th>
              <th className="py-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="lailac-rows">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-ink-muted">
                  {(tickets ?? []).length === 0
                    ? "No tickets issued yet."
                    : "No tickets match."}
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-hairline align-top">
                  <td className="py-2 pr-4">{r.holder_name}</td>
                  <td className="py-2 pr-4 font-mono text-xs text-ink-muted">{r.purchase?.registration_number ?? "â€”"}</td>
                  <td className="py-2 pr-4 text-ink-muted">{r.purchase?.faculty ?? "â€”"}</td>
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
