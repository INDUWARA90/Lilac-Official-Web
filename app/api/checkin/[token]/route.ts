import { z } from "zod";
import { hasCheckinSession } from "@/lib/checkin-auth";
import { getAdminSession } from "@/lib/auth";
import { checkInTicket } from "@/lib/tickets";
import { logAudit } from "@/lib/audit";
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
  if (!(await checkRateLimit(`checkin-action:${getClientIp(req.headers)}`, 240, 60_000)).ok) {
    return json({ ok: false, error: "Too many requests." }, 429);
  }

  const [checkinOk, adminSession] = await Promise.all([hasCheckinSession(), getAdminSession()]);
  if (!checkinOk && !adminSession) return json({ ok: false, error: "Not authorised." }, 401);
  const by = adminSession?.email ?? "door-staff";

  const { token } = await params;
  const parsed = z
    .object({ action: z.enum(["checkin", "refuse"]) })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ ok: false, error: "Invalid request." }, 400);

  if (parsed.data.action === "refuse") {
    await logAudit("ticket.checkin", { token_tail: token.slice(-6), refused: true, by }, null);
    return json({ ok: true, refused: true });
  }

  const r = await checkInTicket(token, by);
  return r.ok
    ? json({ ok: true })
    : json({ ok: false, error: r.error, alreadyAt: r.alreadyAt }, 409);
}
