import type { Metadata } from "next";
import { requireFullAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDrawUnlocked } from "@/lib/app-config";
import { AdminShell } from "@/components/admin/AdminShell";
import { DrawPanel } from "@/components/admin/DrawPanel";
import { DrawLock } from "@/components/admin/DrawLock";

export const metadata: Metadata = { title: "Draw winners", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function DrawPage() {
  const session = await requireFullAdmin();
  const db = createAdminClient();

  const [drawUnlocked, { data: verified }, { data: prevWinners }, { data: draws }] =
    await Promise.all([
      getDrawUnlocked(),
      db.from("entries").select("id").eq("verified", true),
      db.from("winners").select("entry_id"),
      db.from("draws").select("id, winner_count, drawn_at").order("drawn_at", { ascending: false }),
    ]);

  const wonIds = new Set((prevWinners ?? []).map((w) => w.entry_id));
  const eligibleCount = (verified ?? []).filter((e) => !wonIds.has(e.id)).length;

  return (
    <AdminShell email={session.email}>
      <h1 className="text-2xl text-ink">Draw winners</h1>
      <p className="mt-1 font-sans text-sm text-ink-muted">
        Winners are chosen with a cryptographically secure random selection from
        verified entries only. Each draw is recorded and audited.
      </p>

      <div className="mt-6">
        {drawUnlocked ? (
          <DrawPanel eligibleCount={eligibleCount} />
        ) : (
          <DrawLock unlocked={false} />
        )}
      </div>

      {drawUnlocked && (
        <div className="mt-4">
          <DrawLock unlocked variant="inline" />
        </div>
      )}

      <h2 className="mt-10 text-lg text-ink">Previous draws</h2>
      {(draws ?? []).length === 0 ? (
        <p className="mt-2 font-sans text-sm text-ink-muted">No draws yet.</p>
      ) : (
        <table className="mt-3 w-full max-w-xl border-collapse font-sans text-sm">
          <thead>
            <tr className="border-b border-hairline text-left text-ink-muted">
              <th className="py-2 font-medium">Date</th>
              <th className="py-2 font-medium">Winners</th>
            </tr>
          </thead>
          <tbody>
            {(draws ?? []).map((d) => (
              <tr key={d.id} className="border-b border-hairline">
                <td className="py-2">{new Date(d.drawn_at).toLocaleString()}</td>
                <td className="py-2">{d.winner_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AdminShell>
  );
}
