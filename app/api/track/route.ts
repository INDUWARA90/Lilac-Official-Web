import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/http";

/**
 * POST /api/track — record one funnel/analytics event.
 * Fire-and-forget from the client; used for the admin funnel numbers
 * (`ad_view` / `ad_complete`, once per session, no `adId`) and the
 * per-sponsor-ad breakdown (`ad_shown` / `ad_watched`, once per ad, with
 * `adId` — see lib/analytics.ts). Inserts via create_event(), a
 * service-role-only RPC (see 0010_entries_rpc.sql / 0013_ad_analytics.sql) —
 * the anon key can't write to `events` directly.
 */
export const dynamic = "force-dynamic";

const schema = z.object({
  type: z.enum(["ad_view", "ad_complete", "ad_shown", "ad_watched"]),
  adId: z.uuid().optional(),
});

export async function POST(req: Request) {
  const ip = getClientIp(req.headers);
  // Generous cap — just enough to stop a script from flooding the table.
  if (!(await checkRateLimit(`track:${ip}`, 30, 60_000)).ok) {
    return Response.json({ ok: false }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ ok: false }, { status: 400 });

  const args: { p_type: string; p_ad_id?: string } = { p_type: parsed.data.type };
  if (parsed.data.adId) args.p_ad_id = parsed.data.adId;

  await createAdminClient().rpc("create_event", args);
  return Response.json({ ok: true });
}
