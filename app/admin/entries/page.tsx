import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDrawUnlocked } from "@/lib/app-config";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = { title: "Entries", robots: { index: false } };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

type Search = { q?: string; page?: string };

export default async function EntriesPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const session = await requireAdmin();
  const sp = await searchParams;
  void getDrawUnlocked(); // warm the shared cache — AdminShell needs it too, see lib/app-config.ts

  // PostgREST's .or() filter treats , ( ) as syntax — strip them from the query.
  const q = (sp.q ?? "").trim().replace(/[,()*%]/g, "").slice(0, 80);
  const page = Math.max(1, Number(sp.page) || 1);

  const db = createAdminClient();
  let query = db
    .from("entries")
    .select("id, name, email, phone, district, created_at", { count: "exact" })
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
  }

  const from = (page - 1) * PAGE_SIZE;
  const { data: entries, count } = await query.range(from, from + PAGE_SIZE - 1);

  const total = count ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageLink = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return s ? `/admin/entries?${s}` : "/admin/entries";
  };

  return (
    <AdminShell email={session.email}>
      <h1 className="text-2xl text-ink">Entries</h1>

      <form method="get" className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 font-sans text-xs text-ink-muted">
          Search name, email, phone
          <input
            name="q"
            defaultValue={q}
            className="w-64 rounded-field border border-hairline bg-transparent px-3 py-1.5 text-sm text-ink focus:border-accent focus:outline-none"
          />
        </label>
        <button
          type="submit"
          className="rounded-field border border-hairline px-4 py-1.5 font-sans text-sm font-medium text-accent-strong hover:border-accent"
        >
          Apply
        </button>
        {q && (
          <Link href="/admin/entries" className="font-sans text-xs text-ink-muted underline">
            Clear
          </Link>
        )}
      </form>

      <p className="mt-4 font-sans text-xs text-ink-muted">
        {total.toLocaleString()} result{total === 1 ? "" : "s"} · page {page} of {lastPage}
      </p>

      <div className="mt-2 overflow-x-auto">
        <table className="w-full border-collapse font-sans text-sm">
          <thead>
            <tr className="border-b border-hairline text-left text-ink-muted">
              <th className="py-2 pr-4 font-medium">Name</th>
              <th className="py-2 pr-4 font-medium">Email</th>
              <th className="py-2 pr-4 font-medium">Phone</th>
              <th className="py-2 pr-4 font-medium">District</th>
              <th className="py-2 font-medium">Entered</th>
            </tr>
          </thead>
          <tbody>
            {(entries ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-ink-muted">
                  No entries match.
                </td>
              </tr>
            ) : (
              (entries ?? []).map((e) => (
                <tr key={e.id} className="border-b border-hairline">
                  <td className="py-2 pr-4">{e.name}</td>
                  <td className="py-2 pr-4 text-ink-muted">{e.email}</td>
                  <td className="py-2 pr-4 text-ink-muted">{e.phone}</td>
                  <td className="py-2 pr-4 text-ink-muted">{e.district ?? "—"}</td>
                  <td className="py-2 text-ink-muted">
                    {new Date(e.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex gap-3 font-sans text-sm">
        {page > 1 && (
          <Link href={pageLink(page - 1)} className="text-accent-strong hover:underline">
            ← Previous
          </Link>
        )}
        {page < lastPage && (
          <Link href={pageLink(page + 1)} className="text-accent-strong hover:underline">
            Next →
          </Link>
        )}
      </div>
    </AdminShell>
  );
}
