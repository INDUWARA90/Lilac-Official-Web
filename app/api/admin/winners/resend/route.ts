import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { resendWinnerEmail } from "@/lib/winner-emails";

/** POST /api/admin/winners/resend — { winnerId } re-sends one winner's email. */
export const dynamic = "force-dynamic";

const json = (b: unknown, s = 200) => Response.json(b, { status: s });
const schema = z.object({ winnerId: z.uuid() });

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return json({ ok: false, error: "Not signed in." }, 401);
  if (session.role !== "admin") return json({ ok: false, error: "Not authorised." }, 403);

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ ok: false, error: "Invalid request." }, 400);

  const r = await resendWinnerEmail(parsed.data.winnerId);
  return r.ok ? json({ ok: true }) : json({ ok: false, error: r.error }, 400);
}
