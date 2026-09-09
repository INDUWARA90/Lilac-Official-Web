import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/http";

/**
 * POST /api/verify — confirm an entry from its verification token.
 *
 * Why POST (not a plain GET on the emailed link): email security scanners and
 * link-preview bots follow GET links, which would auto-confirm entries. The
 * emailed link opens /verify?token=…, which shows a "Confirm my entry" button
 * that calls this endpoint.
 *
 * Uses the service-role client (RLS bypass) — this is a privileged read/write
 * that must never be exposed to the browser directly.
 */

export const dynamic = "force-dynamic";

const bodySchema = z.object({ token: z.uuid() });

const json = (body: unknown, status = 200) => Response.json(body, { status });

export async function POST(req: Request) {
  const ip = getClientIp(req.headers);
  if (!checkRateLimit(`verify:${ip}`, 20, 60_000).ok) {
    return json({ ok: false, error: "Too many attempts. Please wait a moment." }, 429);
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json({ ok: false, error: "Malformed request." }, 400);
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return json({ ok: false, error: "This confirmation link is not valid." }, 400);
  }

  const supabase = createAdminClient();

  const { data: entry, error } = await supabase
    .from("entries")
    .select("id, verified, name, ticket_code")
    .eq("verification_token", parsed.data.token)
    .maybeSingle();

  if (error) {
    console.error(`Verify lookup failed: ${error.code ?? "unknown"}`);
    return json({ ok: false, error: "Something went wrong. Please try again." }, 500);
  }
  if (!entry) {
    return json({ ok: false, error: "This confirmation link is not valid." }, 404);
  }

  const firstName = entry.name.split(" ")[0] || "there";

  if (entry.verified) {
    return json({
      ok: true,
      alreadyVerified: true,
      ticketCode: entry.ticket_code,
      firstName,
    });
  }

  const { error: updateError } = await supabase
    .from("entries")
    .update({ verified: true, verified_at: new Date().toISOString() })
    .eq("id", entry.id)
    .eq("verified", false); // guard against a double-submit race

  if (updateError) {
    console.error(`Verify update failed: ${updateError.code ?? "unknown"}`);
    return json({ ok: false, error: "Something went wrong. Please try again." }, 500);
  }

  return json({
    ok: true,
    alreadyVerified: false,
    ticketCode: entry.ticket_code,
    firstName,
  });
}
