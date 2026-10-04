import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWinnerEmail } from "@/lib/email/mailjet";

/**
 * Emails every winner whose `email_status` is still "pending" — called once
 * after a draw runs (see app/api/admin/draw/route.ts) and again from the
 * per-winner "Resend" button. Raffle winner counts are small, so this is a
 * single pass rather than a self-chaining batch processor.
 */
export async function sendPendingWinnerEmails(): Promise<void> {
  const db = createAdminClient();
  const { data: pending } = await db
    .from("winners")
    .select("id, entry_id")
    .eq("email_status", "pending");
  if (!pending || pending.length === 0) return;

  const entryIds = [...new Set(pending.map((w) => w.entry_id))];
  const { data: entries } = await db.from("entries").select("id, name, email").in("id", entryIds);
  const byId = new Map((entries ?? []).map((e) => [e.id, e]));

  for (const winner of pending) {
    const entry = byId.get(winner.entry_id);
    if (!entry) continue;
    // Claim it first (pending -> sending) so this pass and a concurrent
    // manual "Resend" click can't both send the same winner's email.
    if (!(await claimWinner(db, winner.id, "pending"))) continue;
    await sendOneWinnerEmail(db, winner.id, entry.name, entry.email);
  }
}

/** Re-send a single winner's email regardless of its current status. */
export async function resendWinnerEmail(winnerId: string): Promise<{ ok: boolean; error?: string }> {
  const db = createAdminClient();
  const { data: winner } = await db.from("winners").select("id, entry_id").eq("id", winnerId).maybeSingle();
  if (!winner) return { ok: false, error: "Winner not found." };

  const { data: entry } = await db.from("entries").select("name, email").eq("id", winner.entry_id).maybeSingle();
  if (!entry) return { ok: false, error: "Entry not found." };

  // Claim it regardless of current status (pending/sent/failed), but not if
  // it's genuinely mid-send — e.g. the auto-send from a just-run draw hasn't
  // finished yet. A claim older than STALE_CLAIM_MS is a send that died (the
  // serverless function timed out or was killed), so it can be re-claimed.
  if (!(await claimWinner(db, winner.id))) {
    return { ok: false, error: "Already sending — try again in a moment." };
  }

  const sent = await sendOneWinnerEmail(db, winner.id, entry.name, entry.email);
  return sent.ok ? { ok: true } : { ok: false, error: sent.reason ?? "Send failed." };
}

/** How long a "sending" claim is trusted before a manual resend may take it over. */
const STALE_CLAIM_MS = 2 * 60_000;

/**
 * Atomically flip a winner's `email_status` to "sending", guarded on its
 * current status so only one caller can claim it. Pass `from` to only claim
 * from that specific status (the auto-send pass); omit it to claim from
 * anything except a *live* "sending" claim (manual resend).
 *
 * While a winner is "sending", `email_sent_at` holds the claim time (there is
 * no separate column for it) — that's what lets a stuck claim be detected.
 * `sendOneWinnerEmail` overwrites it with the real sent time, or clears it.
 */
async function claimWinner(
  db: ReturnType<typeof createAdminClient>,
  winnerId: string,
  from?: "pending",
): Promise<boolean> {
  const now = new Date();
  let query = db
    .from("winners")
    .update({ email_status: "sending", email_sent_at: now.toISOString() })
    .eq("id", winnerId);
  if (from) {
    query = query.eq("email_status", from);
  } else {
    const staleBefore = new Date(now.getTime() - STALE_CLAIM_MS).toISOString();
    query = query.or(
      `email_status.neq.sending,email_sent_at.is.null,email_sent_at.lt.${staleBefore}`,
    );
  }
  const { data } = await query.select("id").maybeSingle();
  return Boolean(data);
}

async function sendOneWinnerEmail(
  db: ReturnType<typeof createAdminClient>,
  winnerId: string,
  name: string,
  email: string,
): Promise<{ ok: boolean; reason?: string }> {
  const sent = await sendWinnerEmail({ to: email, name }).catch(
    (): { ok: false; reason: string } => ({ ok: false, reason: "threw" }),
  );

  await db
    .from("winners")
    .update({
      email_status: sent.ok ? "sent" : "failed",
      email_sent_at: sent.ok ? new Date().toISOString() : null,
    })
    .eq("id", winnerId);

  if (!sent.ok) {
    console.error(`winner email failed for ${winnerId}: ${sent.reason ?? "unknown"}`);
  }

  return sent;
}
