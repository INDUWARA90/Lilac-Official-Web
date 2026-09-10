import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Durable fixed-window rate limiter, backed by the `rate_limits` table through
 * the `rl_hit` RPC — so a limit holds across serverless instances (the old
 * in-memory Map did not).
 *
 * Fails OPEN: if the DB call errors we allow the request rather than lock
 * legitimate entrants out during an infra blip. The signature checks and the
 * one-entry-per-person constraint are the hard guarantees; this is throttling.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ ok: boolean }> {
  try {
    const { data, error } = await createAdminClient().rpc("rl_hit", {
      p_key: key,
      p_limit: limit,
      p_window_ms: windowMs,
    });
    if (error) {
      console.error(`rate-limit rl_hit failed: ${error.code ?? "unknown"}`);
      return { ok: true };
    }
    return { ok: data === true };
  } catch {
    return { ok: true };
  }
}

/**
 * Consume a single-use nonce: true the first time within `ttlMs`, false on
 * every repeat. Same fail-open behaviour as `checkRateLimit`.
 */
export async function consumeNonce(nonce: string, ttlMs: number): Promise<boolean> {
  return (await checkRateLimit(`nonce:${nonce}`, 1, ttlMs)).ok;
}
