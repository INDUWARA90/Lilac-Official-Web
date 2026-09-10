import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/env";
import { sendWinnerEmail, sendAdminAlert } from "@/lib/email/resend";

/**
 * Winner-confirmation emails run as a background job, not inside the draw
 * request — a draw of 50+ winners would otherwise approach the serverless
 * function timeout while the admin waits.
 *
 * Model: `winners.email_status` is the queue.
 *   - the draw inserts winners as `pending`
 *   - `/api/admin/winners/process` drains the queue one small batch per
 *     invocation, re-triggering itself until nothing is `pending`
 *   - each invocation is short, so total draw size no longer matters
 *   - anything left `failed` is handled with the per-row "Resend" button
 */

export const WINNER_EMAIL_BATCH = 10;

export interface BatchResult {
  processed: number;
  failed: number;
  remaining: number;
}

/** Send up to `limit` pending winner emails; return how many are still pending. */
export async function processWinnerEmailBatch(
  limit = WINNER_EMAIL_BATCH,
): Promise<BatchResult> {
  const db = createAdminClient();

  const { data: pending } = await db
    .from("winners")
    .select("id, entry_id")
    .eq("email_status", "pending")
    .order("created_at", { ascending: true })
    .limit(limit);

  let processed = 0;
  let failed = 0;

  for (const winner of pending ?? []) {
    const { data: entry } = await db
      .from("entries")
      .select("name, email")
      .eq("id", winner.entry_id)
      .single();

    if (!entry) {
      await db.from("winners").update({ email_status: "failed" }).eq("id", winner.id);
      failed++;
      continue;
    }

    const result = await sendWinnerEmail({
      to: entry.email,
      name: entry.name,
    });

    await db
      .from("winners")
      .update({
        email_status: result.ok ? "sent" : "failed",
        email_sent_at: result.ok ? new Date().toISOString() : null,
      })
      .eq("id", winner.id);

    processed++;
    if (!result.ok) failed++;
  }

  const { count } = await db
    .from("winners")
    .select("*", { count: "exact", head: true })
    .eq("email_status", "pending");

  return { processed, failed, remaining: count ?? 0 };
}

/** Called once the queue is drained: one summary alert if any winner failed. */
export async function alertOnWinnerEmailFailures(): Promise<void> {
  const db = createAdminClient();
  const { data: failedWinners } = await db
    .from("winners")
    .select("entry_id")
    .eq("email_status", "failed");

  if (!failedWinners || failedWinners.length === 0) return;

  const { data: entries } = await db
    .from("entries")
    .select("name, email")
    .in("id", failedWinners.map((w) => w.entry_id));

  const who = (entries ?? []).map((e) => `${e.name} <${e.email}>`).join(", ");
  await sendAdminAlert(
    "Winner emails failed to send",
    `${failedWinners.length} winner confirmation email(s) failed.\n` +
      `Affected winners: ${who}\n` +
      `Resend them from the Winners page.`,
  );
}

/**
 * Kick the background processor. Fire-and-forget: the processor route responds
 * immediately and does its work in `after()`, so this returns fast. Call inside
 * an `after()` block so the connection actually opens before the caller freezes.
 */
export async function triggerWinnerEmailProcessor(origin: string): Promise<void> {
  const secret = serverEnv.adminSessionSecret;
  if (!secret) return;
  try {
    await fetch(`${origin}/api/admin/winners/process`, {
      method: "POST",
      headers: { "x-internal-key": secret },
    });
  } catch {
    console.error("winner-email processor: trigger failed");
  }
}
