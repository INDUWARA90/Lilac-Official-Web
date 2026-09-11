import { z } from "zod";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, createSessionValue, passwordMatches, type AdminRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { serverEnv } from "@/lib/env";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/http";

/**
 * POST /api/admin/login — email + password sign-in, shared by two logins:
 *
 *   { email, password }  → on a match, sets the signed `admin_session` cookie.
 *
 * The submitted email decides which role it is — ADMIN_EMAIL (full access)
 * or TICKET_MANAGER_EMAIL (ticket review + check-in only, if configured).
 * There's no account store — this is a two-operator-at-most panel.
 */
export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.email(),
  password: z.string().min(1).max(200),
});

const json = (body: unknown, status = 200) => Response.json(body, { status });

export async function POST(req: Request) {
  const ip = getClientIp(req.headers);
  if (!(await checkRateLimit(`admin-login:${ip}`, 10, 10 * 60_000)).ok) {
    return json({ ok: false, error: "Too many attempts. Please wait a few minutes." }, 429);
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return json({ ok: false, error: "Enter your email and password." }, 400);
  }

  const email = parsed.data.email.toLowerCase();
  let role: AdminRole | null = null;
  let expectedPassword = "";
  if (email === serverEnv.adminEmail) {
    role = "admin";
    expectedPassword = serverEnv.adminPassword;
  } else if (serverEnv.ticketManagerEmail && email === serverEnv.ticketManagerEmail) {
    role = "ticket_manager";
    expectedPassword = serverEnv.ticketManagerPassword;
  }

  const passwordOk = role !== null && passwordMatches(parsed.data.password, expectedPassword);

  // Same response whichever half is wrong, so this can't be used to probe
  // which emails are valid logins.
  if (!role || !passwordOk) {
    await logAudit("admin.login_failed", { email: parsed.data.email }, null);
    return json({ ok: false, error: "Email or password is incorrect." }, 401);
  }

  const { value, maxAgeSeconds } = createSessionValue({ email, role });
  (await cookies()).set(ADMIN_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });

  await logAudit("admin.login", { email, role }, null);

  return json({ ok: true });
}
