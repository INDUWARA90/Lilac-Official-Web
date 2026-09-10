import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { serverEnv } from "@/lib/env";
import { consumeNonce } from "@/lib/rate-limit";

/**
 * Ad-watch session token — issued when `/enter` serves the ads, required by
 * `/api/entry`. It proves two things:
 *   1. the ads page was actually served by us   → valid HMAC signature
 *   2. at least the minimum watch time elapsed  → `now - iat >= req`
 * A direct POST to /api/entry with no token, a forged token, or a token
 * replayed after use is rejected.
 *
 * Stateless `payload.signature` plus a one-time nonce consumed on use.
 */

const PER_AD_MS = 5_000; // matches VIDEO_MIN_WATCH_SECONDS / IMAGE_AUTO_ADVANCE_SECONDS
const GRACE_MS = 2_000; // slack for player load + between-ad transitions
const MAX_AGE_MS = 3 * 60 * 60 * 1000; // token usable for 3h after issue

type Payload = { iat: number; req: number; n: string };

function secret(): string {
  const s = serverEnv.adSessionSecret;
  if (!s) {
    throw new Error(
      "Missing AD_SESSION_SECRET (or ADMIN_SESSION_SECRET as fallback). Add it to .env.local.",
    );
  }
  return s;
}

function sign(body: string): string {
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

function requiredMs(adCount: number): number {
  return Math.max(3_000, adCount * PER_AD_MS - GRACE_MS);
}

export function issueAdSession(adCount: number): string {
  const payload: Payload = {
    iat: Date.now(),
    req: requiredMs(Math.max(1, adCount)),
    n: randomBytes(12).toString("base64url"),
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export async function verifyAdSession(
  token: unknown,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (typeof token !== "string" || !token) return { ok: false, reason: "missing" };

  const [body, sig] = token.split(".");
  if (!body || !sig) return { ok: false, reason: "malformed" };

  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "bad-signature" };
  }

  let payload: Payload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString());
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (
    typeof payload.iat !== "number" ||
    typeof payload.req !== "number" ||
    typeof payload.n !== "string"
  ) {
    return { ok: false, reason: "malformed" };
  }

  const age = Date.now() - payload.iat;
  if (age < -60_000) return { ok: false, reason: "future" };
  if (age > MAX_AGE_MS) return { ok: false, reason: "expired" };
  if (age < payload.req) return { ok: false, reason: "too-fast" };

  if (!(await consumeNonce(`ad:${payload.n}`, MAX_AGE_MS))) {
    return { ok: false, reason: "already-used" };
  }

  return { ok: true };
}
