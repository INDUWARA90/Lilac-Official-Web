import { z } from "zod";
import { after } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { pickRandom } from "@/lib/draw";
import { logAudit } from "@/lib/audit";
import { getDrawUnlocked, setDrawUnlocked } from "@/lib/app-config";
import { triggerWinnerEmailProcessor } from "@/lib/winner-emails";

/**
 * POST /api/admin/draw
 *
 *   { action: "unlock" | "lock" }  — toggle the event-day draw lock
 *   { action: "run", winnerCount } — run a draw (only when unlocked):
 *     1. eligible = verified entries that haven't already won
 *     2. pick `winnerCount` of them with crypto.randomInt
 *     3. record the draw + winners (email_status defaults to 'pending'), audit
 *     4. kick the background winner-email processor and return immediately
 */
export const dynamic = "force-dynamic";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("unlock") }),
  z.object({ action: z.literal("lock") }),
  z.object({ action: z.literal("run"), winnerCount: z.number().int().min(1).max(500) }),
]);
const json = (b: unknown, s = 200) => Response.json(b, { status: s });

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return json({ ok: false, error: "Not signed in." }, 401);

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return json({ ok: false, error: "Invalid request." }, 400);
  }
  const input = parsed.data;

  if (input.action === "unlock" || input.action === "lock") {
    const unlocked = input.action === "unlock";
    const ok = await setDrawUnlocked(unlocked, session.email);
    if (!ok) return json({ ok: false, error: "Could not update the draw lock." }, 500);
    await logAudit(`draw.${input.action}`, { by: session.email }, null);
    return json({ ok: true, drawUnlocked: unlocked });
  }

  // action === "run" — refuse unless an admin has unlocked the draw.
  if (!(await getDrawUnlocked())) {
    return json(
      { ok: false, error: "The draw is locked. Unlock it from the dashboard first." },
      403,
    );
  }

  const { winnerCount } = input;
  const db = createAdminClient();

  // 1. Work out who's eligible.
  const [{ data: verified, error: vErr }, { data: prevWinners, error: wErr }] =
    await Promise.all([
      db.from("entries").select("id").eq("verified", true),
      db.from("winners").select("entry_id"),
    ]);

  if (vErr || wErr) {
    console.error("Draw: failed to load pools");
    return json({ ok: false, error: "Could not load entries. Please try again." }, 500);
  }

  const alreadyWon = new Set((prevWinners ?? []).map((w) => w.entry_id));
  const eligible = (verified ?? []).map((e) => e.id).filter((id) => !alreadyWon.has(id));

  if (eligible.length === 0) {
    return json({ ok: false, error: "There are no eligible entries to draw from." }, 400);
  }
  if (winnerCount > eligible.length) {
    return json(
      { ok: false, error: `Only ${eligible.length} eligible entr${eligible.length === 1 ? "y" : "ies"} — reduce the winner count.` },
      400,
    );
  }

  // 2. Pick.
  const winnerEntryIds = pickRandom(eligible, winnerCount);

  // 3. Record the draw, then the winners.
  const { data: draw, error: drawErr } = await db
    .from("draws")
    .insert({ admin_id: null, winner_count: winnerCount })
    .select("id")
    .single();

  if (drawErr || !draw) {
    console.error("Draw: failed to insert draw row");
    return json({ ok: false, error: "Could not record the draw. Please try again." }, 500);
  }

  const { error: winErr } = await db
    .from("winners")
    .insert(winnerEntryIds.map((entry_id) => ({ entry_id, draw_id: draw.id })));

  if (winErr) {
    console.error("Draw: failed to insert winners; rolling back draw");
    await db.from("draws").delete().eq("id", draw.id);
    return json({ ok: false, error: "Could not record winners. Please try again." }, 500);
  }

  await logAudit(
    "draw.run",
    { draw_id: draw.id, winner_count: winnerCount, winner_entry_ids: winnerEntryIds, by: session.email },
    null,
  );

  // 4. Hand winner emails to the background processor (runs after this response).
  const origin = new URL(req.url).origin;
  after(() => triggerWinnerEmailProcessor(origin));

  return json({
    ok: true,
    drawId: draw.id,
    winners: winnerEntryIds.length,
  });
}
