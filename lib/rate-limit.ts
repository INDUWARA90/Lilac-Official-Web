import "server-only";

/**
 * Small in-memory rate limiter (fixed window).
 *
 * Note: serverless instances don't share memory, so this limits per instance,
 * not globally. Combined with Turnstile that's enough for this project. Swap the
 * Map for Vercel KV / Upstash later if needed — same `checkRateLimit` signature.
 */
const hits = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  entry.count += 1;
  return { ok: entry.count <= limit };
}
