import type { Metadata } from "next";
import { requireFullAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDrawUnlocked } from "@/lib/app-config";
import { AdminShell } from "@/components/admin/AdminShell";
import { ResendButton } from "@/components/admin/ResendButton";
import { SendPendingButton } from "@/components/admin/SendPendingButton";

export const metadata: Metadata = { title: "Winners", robots: { index: false } };
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  sent: "Sent",
  failed: "Failed",
};

export default async function WinnersPage() {
  const session = await requireFullAdmin();
  const db = createAdminClient();
  void getDrawUnlocked(); // warm the shared cache — AdminShell needs it too, see lib/app-config.ts

  const { data: winners } = await db
    .from("winners")
    .select("id, entry_id, draw_id, email_status, email_sent_at, created_at")
    .order("created_at", { ascending: false });

  const entryIds = [...new Set((winners ?? []).map((w) => w.entry_id))];
  const { data: entries } = await db
    .from("entries")
    .select("id, name, email")
    .in("id", entryIds.length ? entryIds : ["00000000-0000-0000-0000-000000000000"]);
  const byId = new Map((entries ?? []).map((e) => [e.id, e]));
  const pending = (winners ?? []).filter((w) => w.email_status === "pending").length;

  return (
    <AdminShell email={session.email}>
      <h1 className="text-2xl text-ink">Winners</h1>
      <p className="mt-1 font-sans text-sm text-ink-muted">
        {(winners ?? []).length} winner(s) across all draws.
      </p>

      {pending > 0 && <SendPendingButton pending={pending} />}

      {(winners ?? []).length === 0 ? (
        <p className="mt-6 font-sans text-sm text-ink-muted">No winners drawn yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse font-sans text-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-ink-muted">
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Email</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Sent</th>
                <th className="py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {(winners ?? []).map((w) => {
                const e = byId.get(w.entry_id);
                return (
                  <tr key={w.id} className="border-b border-hairline align-middle">
                    <td className="py-2 pr-4">{e?.name ?? "—"}</td>
                    <td className="py-2 pr-4 text-ink-muted">{e?.email ?? "—"}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={
                          w.email_status === "failed"
                            ? "text-red-600"
                            : w.email_status === "sent"
                              ? "text-ink"
                              : "text-ink-muted"
                        }
                      >
                        {STATUS_LABEL[w.email_status] ?? w.email_status}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-ink-muted">
                      {w.email_sent_at ? new Date(w.email_sent_at).toLocaleString() : "—"}
                    </td>
                    <td className="py-2">
                      <ResendButton winnerId={w.id} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
