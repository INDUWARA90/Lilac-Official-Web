import "server-only";

/**
 * Best-effort client IP for rate-limiting. On Vercel, `x-forwarded-for` is set
 * by the platform and its left-most entry is the real client. Locally it's
 * usually absent, so we fall back to a constant bucket.
 *
 * This is used ONLY for rate-limiting, never stored on the entry or logged as
 * PII.
 */
export function getClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}
