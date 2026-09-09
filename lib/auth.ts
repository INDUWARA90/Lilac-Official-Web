import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireServer, serverEnv } from "@/lib/env";

/**
 * Admin session — a single signed cookie, no external session store.
 *
 * After passwordless email sign-in succeeds (see /api/admin/login), we drop an
 * `admin_session` cookie holding `{ email, sub, exp }` signed with HMAC-SHA256.
 * Every admin page/route calls `requireAdmin()` / `getAdminSession()`, which
 * verify the signature and the 24h expiry (brief: "session expires after 1 day").
 * `sub` is the Supabase Auth user id, used for `draws.admin_id` / audit rows.
 */
export const ADMIN_COOKIE = "admin_session";
const SESSION_MS = 24 * 60 * 60 * 1000;

export interface AdminSession {
  email: string;
  sub: string;
}

function sign(payload: string): string {
  const secret = requireServer("ADMIN_SESSION_SECRET", serverEnv.adminSessionSecret);
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/** Build the cookie value for a freshly authenticated admin. */
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
      sub: string;
      exp: number;
    };
    if (typeof data.exp !== "number" || Date.now() > data.exp) return null;
    if (data.email.toLowerCase() !== serverEnv.adminEmail) return null;
    return { email: data.email, sub: data.sub };
  } catch {
    return null;
  }
}

/** Guard for admin PAGES. Redirects to login when not a signed-in admin. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}
