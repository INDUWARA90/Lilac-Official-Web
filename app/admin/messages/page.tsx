import type { Metadata } from "next";
import Link from "next/link";
import { requireFullAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDrawUnlocked } from "@/lib/app-config";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = { title: "Messages", robots: { index: false } };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

type Search = { q?: string; page?: string };

export default async function ContactMessagesPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const session = await requireFullAdmin();
  const sp = await searchParams;
  void getDrawUnlocked(); // warm the shared cache — AdminShell needs it too, see lib/app-config.ts

  // PostgREST's .or() filter treats , ( ) as syntax — strip them from the query.
  const q = (sp.q ?? "").trim().replace(/[,()*%]/g, "").slice(0, 80);
  const page = Math.max(1, Number(sp.page) || 1);

  const db = createAdminClient();
  let query = db
    .from("contact_messages")
    .select("id, name, email, message, created_at", { count: "exact" })
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,message.ilike.%${q}%`);
  }

  const from = (page - 1) * PAGE_SIZE;
  const { data: messages, count } = await query.range(from, from + PAGE_SIZE - 1);

  const total = count ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageLink = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return s ? `/admin/messages?${s}` : "/admin/messages";
  };

  return (
    <AdminShell email={session.email}>
      <h1 className="text-2xl text-ink">Messages</h1>
      <p className="mt-1 font-sans text-sm text-ink-muted">
        Contact-form submissions. Reply directly to the sender&rsquo;s email — nothing is
        emailed to you automatically.
      </p>

      <form method="get" className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 font-sans text-xs text-ink-muted">
          Search name, email, message
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
          <Link href="/admin/messages" className="font-sans text-xs text-ink-muted underline">
            Clear
          </Link>
        )}
      </form>

      <p className="mt-4 font-sans text-xs text-ink-muted">
        {total.toLocaleString()} result{total === 1 ? "" : "s"} · page {page} of {lastPage}
      </p>

      <div className="mt-3 flex flex-col gap-3">
        {(messages ?? []).length === 0 ? (
          <p className="py-6 text-center font-sans text-sm text-ink-muted">No messages match.</p>
        ) : (
          (messages ?? []).map((m) => (
            <div key={m.id} className="rounded-card border border-hairline p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-sans text-sm font-medium text-ink">
                  {m.name} ·{" "}
                  <a href={`mailto:${m.email}`} className="text-accent-strong hover:underline">
                    {m.email}
                  </a>
                </p>
                <p className="font-sans text-xs text-ink-muted">
                  {new Date(m.created_at).toLocaleString()}
                </p>
              </div>
              <p className="mt-2 whitespace-pre-wrap font-sans text-sm text-ink-muted">
                {m.message}
              </p>
            </div>
          ))
        )}
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
