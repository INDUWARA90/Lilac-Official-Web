import { z } from "zod";
import { cookies } from "next/headers";
import { createAnonClient } from "@/lib/supabase/client";
import { ADMIN_COOKIE, createSessionValue } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { serverEnv } from "@/lib/env";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/http";

/**
 * POST /api/admin/login — passwordless email sign-in for the single admin.
 *
 *   { action: "request", email }        → emails a 6-digit sign-in code
 *   { action: "verify", email, code }   → checks the code, sets the session cookie
 *
 * Uses Supabase Auth's email OTP. On success we mint our own signed
 * `admin_session` cookie (see lib/auth.ts) and don't keep a Supabase session.
 */
export const dynamic = "force-dynamic";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("request"), email: z.email() }),
  z.object({
    action: z.literal("verify"),
    email: z.email(),
    code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code."),
  }),
]);

const json = (body: unknown, status = 200) => Response.json(body, { status });

export async function POST(req: Request) {
  const ip = getClientIp(req.headers);
  if (!checkRateLimit(`admin-login:${ip}`, 10, 10 * 60_000).ok) {
    return json({ ok: false, error: "Too many attempts. Please wait a few minutes." }, 429);
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return json({ ok: false, error: "Invalid request." }, 400);
  }

  const input = parsed.data;
  const isAdmin = input.email.toLowerCase() === serverEnv.adminEmail;
  const supabase = createAnonClient();

  if (input.action === "request") {
    // Only actually send to the configured admin address, but always respond the
    // same way so this can't be used to probe for the admin email.
    if (isAdmin) {
      await supabase.auth.signInWithOtp({
        email: input.email,
        options: { shouldCreateUser: false },
      });
    }
    return json({ ok: true });
  }

  // action === "verify"
  if (!isAdmin) {
    return json({ ok: false, error: "That code is not valid." }, 401);
  }

  const { data, error } = await supabase.auth.verifyOtp({
    email: input.email,
    token: input.code,
    type: "email",
  });

  if (error || !data.user || data.user.email?.toLowerCase() !== serverEnv.adminEmail) {
    return json({ ok: false, error: "That code is not valid or has expired." }, 401);
  }

  const { value, maxAgeSeconds } = createSessionValue({
    email: data.user.email,
    sub: data.user.id,
  });
  (await cookies()).set(ADMIN_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });

  // Don't retain the Supabase session — our own cookie is the source of truth.
  await supabase.auth.signOut().catch(() => {});

  await logAudit("admin.login", { email: data.user.email }, data.user.id);

  return json({ ok: true });
}
