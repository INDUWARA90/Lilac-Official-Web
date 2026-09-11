import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { sendWinnerEmail } from "@/lib/email/brevo";

/**
 * POST /api/admin/winners/resend — manually (re)send one winner's confirmation
 * email, on top of the automatic send during the draw.
 */
export const dynamic = "force-dynamic";

const schema = z.object({ winnerId: z.uuid() });
const json = (b: unknown, s = 200) => Response.json(b, { status: s });

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return json({ ok: false, error: "Not signed in." }, 401);
  if (session.role !== "admin") return json({ ok: false, error: "Not authorised." }, 403);

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ ok: false, error: "Invalid request." }, 400);

  const db = createAdminClient();

  const { data: winner, error } = await db
    .from("winners")
    .select("id, entry_id")
    .eq("id", parsed.data.winnerId)
    .single();

  if (error || !winner) {
    return json({ ok: false, error: "Winner not found." }, 404);
  }

  const { data: entry } = await db
    .from("entries")
    .select("name, email")
    .eq("id", winner.entry_id)
    .single();

  if (!entry) return json({ ok: false, error: "Winner entry not found." }, 404);

  const result = await sendWinnerEmail({
    to: entry.email,
    name: entry.name,
  });

  await db
    .from("winners")
    .update({
      email_status: result.ok ? "sent" : "failed",
      email_sent_at: result.ok ? new Date().toISOString() : null,
    })
    .eq("id", winner.id);

  await logAudit(
    "winner.email_resend",
    { winner_id: winner.id, entry_id: winner.entry_id, ok: result.ok, by: session.email },
    null,
  );

  return result.ok
    ? json({ ok: true })
    : json({ ok: false, error: "The email could not be sent. Try again shortly." }, 502);
}
