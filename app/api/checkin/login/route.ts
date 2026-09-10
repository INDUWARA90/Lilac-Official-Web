import { z } from "zod";
import { cookies } from "next/headers";
import {
  CHECKIN_COOKIE,
  checkinCodeMatches,
  createCheckinSessionValue,
} from "@/lib/checkin-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/http";

/**
 * POST /api/checkin/login — door staff enter the shared CHECKIN_ACCESS_CODE.
 * On a match, sets the scoped `checkin_session` cookie (check-in pages only).
 */
export const dynamic = "force-dynamic";

const json = (b: unknown, s = 200) => Response.json(b, { status: s });

export async function POST(req: Request) {
  const ip = getClientIp(req.headers);
  if (!(await checkRateLimit(`checkin-login:${ip}`, 10, 10 * 60_000)).ok) {
    return json({ ok: false, error: "Too many attempts. Please wait a few minutes." }, 429);
  }

  const parsed = z
    .object({ code: z.string().min(1).max(200) })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ ok: false, error: "Enter the access code." }, 400);

  if (!checkinCodeMatches(parsed.data.code)) {
    return json({ ok: false, error: "That code is not correct." }, 401);
  }

  const { value, maxAgeSeconds } = createCheckinSessionValue();
  (await cookies()).set(CHECKIN_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });

  return json({ ok: true });
}
