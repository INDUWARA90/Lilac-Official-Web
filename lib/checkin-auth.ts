import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireServer, serverEnv } from "@/lib/env";

/**
 * Door-staff check-in session — a scoped, signed cookie that unlocks ONLY the
 * check-in pages (`/checkin/*`), never the rest of the admin panel.
 *
 * Staff enter the shared `CHECKIN_ACCESS_CODE` once on their phone (see
 * `/checkin`); on a match we drop a `checkin_session` cookie holding
 * `{ scope: "checkin", exp }` signed with HMAC-SHA256 (reusing
 * ADMIN_SESSION_SECRET). The `scope` string keeps an admin cookie from being
 * replayed here and vice versa.
 */
export const CHECKIN_COOKIE = "checkin_session";
const SESSION_MS = 16 * 60 * 60 * 1000; // one long event day

function secret(): string {
  return requireServer("ADMIN_SESSION_SECRET", serverEnv.adminSessionSecret);
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

/** Constant-time compare of a submitted code against CHECKIN_ACCESS_CODE. */
export function checkinCodeMatches(candidate: string): boolean {
  const expected = serverEnv.checkinAccessCode;
  if (!expected) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function createCheckinSessionValue(): { value: string; maxAgeSeconds: number } {
  const payload = Buffer.from(
    JSON.stringify({ scope: "checkin", exp: Date.now() + SESSION_MS }),
  ).toString("base64url");
  return { value: `${payload}.${sign(payload)}`, maxAgeSeconds: SESSION_MS / 1000 };
}

/** True when a valid, unexpired check-in cookie is present. */
export async function hasCheckinSession(): Promise<boolean> {
  const raw = (await cookies()).get(CHECKIN_COOKIE)?.value;
  if (!raw) return false;

  const [payload, signature] = raw.split(".");
  if (!payload || !signature) return false;

  const a = Buffer.from(signature);
  const b = Buffer.from(sign(payload));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
      scope?: string;
      exp?: number;
    };
    return data.scope === "checkin" && typeof data.exp === "number" && Date.now() <= data.exp;
  } catch {
    return false;
  }
}

/** Guard for check-in PAGES. Redirects to `/checkin` when not unlocked. */
export async function requireCheckin(): Promise<void> {
  if (!(await hasCheckinSession())) redirect("/checkin");
}
