import { z } from "zod";
import { hasCheckinSession } from "@/lib/checkin-auth";
import { getAdminSession } from "@/lib/auth";
import { checkInTicket, undoCheckIn } from "@/lib/tickets";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/http";

/**
 * POST /api/checkin/[token] — door action for one ticket.
 *   { action: "checkin" } — mark the holder admitted (single-use)
 *   { action: "refuse" }  — log a refused entry, no state change
 *
 * Authorised by the scoped check-in cookie OR a full admin session.
 */
export const dynamic = "force-dynamic";

const json = (b: unknown, s = 200) => Response.json(b, { status: s });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  // Generous cap — never trips real door traffic, blunts a runaway script.
  const [rateLimit, checkinOk] = await Promise.all([
    checkRateLimit(`checkin-action:${getClientIp(req.headers)}`, 1_200, 60_000),
    hasCheckinSession(),
  ]);
  if (!rateLimit.ok) {
    return json({ ok: false, error: "Too many requests." }, 429);
  }

  // Door staff use the scoped session, so skip admin-cookie verification on
  // their normal scan path. Admin credentials remain a supported fallback.
  const adminSession = checkinOk ? null : await getAdminSession();
  if (adminSession?.role === "tshirt_manager" || (!checkinOk && !adminSession)) {
    return json({ ok: false, error: "Not authorised." }, 401);
  }
  const by = adminSession?.email ?? "door-staff";

  const { token } = await params;
  const parsed = z
    .object({ action: z.enum(["checkin", "checkout"]) })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ ok: false, error: "Invalid request." }, 400);

  if (parsed.data.action === "checkout") {
    const r = await undoCheckIn(token);
    return r.ok ? json({ ok: true }) : json({ ok: false, error: r.error }, 400);
  }

  const r = await checkInTicket(token, by);
  return r.ok
    ? json({ ok: true })
    : json({ ok: false, error: r.error, alreadyAt: r.alreadyAt }, 409);
}
