import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireServer, serverEnv } from "@/lib/env";

/**
 * Admin session — a single signed cookie, no external session store.
 *
 * Two logins share this one cookie/session shape, distinguished by `role`:
 *   - "admin"          — ADMIN_EMAIL / ADMIN_PASSWORD. Full access.
 *   - "ticket_manager" — TICKET_MANAGER_EMAIL / TICKET_MANAGER_PASSWORD
 *                        (optional — unset means this login doesn't exist).
 *                        Scoped to ticket review + check-in only; every other
 *                        admin page/route uses `requireFullAdmin()` to shut
 *                        this role out. See app/api/admin/login/route.ts for
 *                        how the submitted email picks the role.
 *
 * On success we drop an `admin_session` cookie holding `{ email, role, exp }`
 * signed with HMAC-SHA256. Every admin page/route calls `requireAdmin()` /
 * `requireFullAdmin()` / `getAdminSession()`, which verify the signature and
 * the 24h expiry (brief: "session expires after 1 day").
 */
export const ADMIN_COOKIE = "admin_session";
const SESSION_MS = 24 * 60 * 60 * 1000;

export type AdminRole = "admin" | "ticket_manager";

export interface AdminSession {
  email: string;
  role: AdminRole;
}

function sign(payload: string): string {
  const secret = requireServer("ADMIN_SESSION_SECRET", serverEnv.adminSessionSecret);
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/** Constant-time compare of a submitted password against an expected one. */
export function passwordMatches(candidate: string, expected: string): boolean {
  if (!expected) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Build the cookie value for a freshly authenticated admin/ticket-manager. */
export function createSessionValue(session: AdminSession): {
  value: string;
  maxAgeSeconds: number;
} {
  const payload = Buffer.from(
    JSON.stringify({ ...session, exp: Date.now() + SESSION_MS }),
  ).toString("base64url");
  return { value: `${payload}.${sign(payload)}`, maxAgeSeconds: SESSION_MS / 1000 };
}

/** The admin session if the cookie is present, valid and unexpired; else null. */
export async function getAdminSession(): Promise<AdminSession | null> {
  const raw = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!raw) return null;

  const [payload, signature] = raw.split(".");
  if (!payload || !signature) return null;

  const a = Buffer.from(signature);
  const b = Buffer.from(sign(payload));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
      email: string;
      role?: string;
      exp: number;
    };
    if (typeof data.exp !== "number" || Date.now() > data.exp) return null;

    const email = data.email.toLowerCase();
    // Re-derive the role from the current env config rather than trusting the
    // cookie's own `role` claim at face value — if TICKET_MANAGER_EMAIL is
    // ever removed/rotated, existing ticket-manager cookies stop resolving to
    // any known account instead of silently keeping stale access.
    if (email === serverEnv.adminEmail) return { email, role: "admin" };
    if (serverEnv.ticketManagerEmail && email === serverEnv.ticketManagerEmail) {
      return { email, role: "ticket_manager" };
    }
    return null;
  } catch {
    return null;
  }
}

/** Guard for admin PAGES. Redirects to login when not signed in as anyone. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

/**
 * Guard for pages/actions reserved for the full admin only. A signed-in
 * ticket manager is bounced to their own home (`/admin/tickets`) rather than
 * the login page — they ARE authenticated, just not authorised for this.
 */
export async function requireFullAdmin(): Promise<AdminSession> {
  const session = await requireAdmin();
  if (session.role !== "admin") redirect("/admin/tickets");
  return session;
}
