import { z } from "zod";
import { createAnonClient } from "@/lib/supabase/client";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/http";

/**
 * POST /api/track — record one funnel event (`ad_view` | `ad_complete`).
 * Fire-and-forget from the client; used only for the admin funnel numbers.
 * Inserts via the anon client (RLS: INSERT-only on `events`).
 */
export const dynamic = "force-dynamic";

const schema = z.object({ type: z.enum(["ad_view", "ad_complete"]) });

export async function POST(req: Request) {
  const ip = getClientIp(req.headers);
  // Generous cap — just enough to stop a script from flooding the table.
  if (!(await checkRateLimit(`track:${ip}`, 30, 60_000)).ok) {
    return Response.json({ ok: false }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ ok: false }, { status: 400 });

  await createAnonClient().from("events").insert({ type: parsed.data.type });
  return Response.json({ ok: true });
}
