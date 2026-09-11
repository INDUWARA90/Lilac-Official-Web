import type { Metadata } from "next";
import Link from "next/link";
import { requireFullAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDrawUnlocked } from "@/lib/app-config";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = { title: "Audit log", robots: { index: false } };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const ACTION_LABEL: Record<string, string> = {
  "admin.login": "Admin signed in",
  "draw.run": "Draw run",
  "draw.unlock": "Draw unlocked",
  "draw.lock": "Draw locked",
  "winner.email_resend": "Winner email resent",
  "export.entries": "Entries exported",
  "export.winners": "Winners exported",
  "export.tickets": "Ticket purchases exported",
  "export.checkins": "Check-in list exported",
  "ad.create": "Ad added",
  "ad.update_title": "Ad renamed",
  "ad.delete": "Ad removed",
  "ad.reorder": "Ads reordered",
  "ticket.approve": "Ticket approved",
  "ticket.reject": "Ticket rejected",
  "ticket.checkin": "Ticket checked in",
  "ticket.checkin_undo": "Check-in reverted",
  "ticket.settings": "Ticket settings updated",
};

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await requireFullAdmin();
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const from = (page - 1) * PAGE_SIZE;
  void getDrawUnlocked(); // warm the shared cache — AdminShell needs it too, see lib/app-config.ts

  const { data: rows, count } = await createAdminClient()
    .from("audit_log")
    .select("id, action, details, admin_id, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const total = count ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AdminShell email={session.email}>
      <h1 className="text-2xl text-ink">Audit log</h1>
      <p className="mt-1 font-sans text-sm text-ink-muted">
        Admin sign-ins, draws, winner-email resends, exports, and ad changes.
      </p>
      <p className="mt-4 font-sans text-xs text-ink-muted">
        {total.toLocaleString()} event{total === 1 ? "" : "s"} · page {page} of {lastPage}
      </p>

      <div className="mt-2 overflow-x-auto">
        <table className="w-full border-collapse font-sans text-sm">
          <thead>
            <tr className="border-b border-hairline text-left text-ink-muted">
              <th className="py-2 pr-4 font-medium">When</th>
              <th className="py-2 pr-4 font-medium">Action</th>
              <th className="py-2 font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).length === 0 ? (
              <tr>
                <td colSpan={3} className="py-6 text-center text-ink-muted">
                  No audit events yet.
                </td>
              </tr>
            ) : (
              (rows ?? []).map((r) => (
                <tr key={r.id} className="border-b border-hairline align-top">
                  <td className="whitespace-nowrap py-2 pr-4 text-ink-muted">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap py-2 pr-4 text-ink">
                    {ACTION_LABEL[r.action] ?? r.action}
                  </td>
                  <td className="py-2 font-mono text-xs text-ink-muted">
                    {JSON.stringify(r.details)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex gap-3 font-sans text-sm">
        {page > 1 && (
          <Link
            href={`/admin/audit${page - 1 > 1 ? `?page=${page - 1}` : ""}`}
            className="text-accent-strong hover:underline"
          >
            ← Newer
          </Link>
        )}
        {page < lastPage && (
          <Link href={`/admin/audit?page=${page + 1}`} className="text-accent-strong hover:underline">
            Older →
          </Link>
        )}
      </div>
    </AdminShell>
  );
}
