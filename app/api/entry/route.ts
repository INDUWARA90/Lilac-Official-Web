import { z } from "zod";
import { entryInputSchema } from "@/lib/validation/entry";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyAdSession } from "@/lib/ad-session";
import { getClientIp } from "@/lib/http";

/**
 * POST /api/entry — create a raffle entry. There is no email confirmation step:
 * the entry counts immediately and the client shows the success screen. Only
 * winners are emailed (after a draw).
 *
 * Flow:
 *   1. rate-limit + zod                     (cheap rejections first)
 *   2. call create_entry() (service-role)   — a SECURITY DEFINER RPC, granted
 *      to service_role only (see 0010_entries_rpc.sql). The anon key can't
 *      reach `entries` by any path, so this route's rate limit, ad-watch-
 *      session check, and zod validation can't be bypassed by calling
 *      Supabase directly.
 *        - unique violation → 409 "already entered"
 *   3. mark it verified (service-role). A BEFORE INSERT trigger forces
 *      `verified=false`, so this flip is a separate statement.
 */

export const dynamic = "force-dynamic";

type ErrorBody = {
  ok: false;
  error: string;
  fieldErrors?: Record<string, string[]>;
};

const json = (body: unknown, status = 200) => Response.json(body, { status });

export async function POST(req: Request) {
  const ip = getClientIp(req.headers);

  // ---- 1a. Rate limit: 8 submissions per IP per 10 minutes --------------
  if (!(await checkRateLimit(`entry:${ip}`, 8, 10 * 60_000)).ok) {
    return json(
      { ok: false, error: "Too many attempts. Please wait a few minutes and try again." } satisfies ErrorBody,
      429,
    );
  }

  // ---- 1b. Parse + validate body --------------------------------------
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json({ ok: false, error: "Malformed request." } satisfies ErrorBody, 400);
  }

  const parsed = entryInputSchema.safeParse(raw);
  if (!parsed.success) {
    return json(
      {
        ok: false,
        error: "Please correct the highlighted fields.",
        fieldErrors: z.flattenError(parsed.error).fieldErrors,
      } satisfies ErrorBody,
      400,
    );
  }
  const input = parsed.data;

  // ---- 1c. Ad-watch gate: a valid, unused, old-enough session token -----
  const adCheck = await verifyAdSession(input.adSession);
  if (!adCheck.ok) {
    const softFail = adCheck.reason === "too-fast" || adCheck.reason === "already-used";
    return json(
      {
        ok: false,
        error: softFail
          ? "Please watch the ads on the entry page before submitting."
          : "Your entry session expired. Reload the page and watch the ads again.",
      } satisfies ErrorBody,
      403,
    );
  }
  const adWatchedAt = new Date().toISOString();

  // ---- 2. Create the entry via the service-role-only RPC -----------------
  const admin = createAdminClient();
  const { error: insertError } = await admin.rpc("create_entry", {
    p_name: input.name,
    p_email: input.email,
    p_phone: input.phone,
    p_address: input.address,
    p_age_range: input.ageRange,
    p_gender: input.gender,
    p_occupation: input.occupation ? input.occupation : null,
    p_district: input.district,
    p_ad_watched_at: adWatchedAt,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return json(
        {
          ok: false,
          error:
            "An entry with this email address or phone number already exists. Only one entry per person is permitted.",
        } satisfies ErrorBody,
        409,
      );
    }
    console.error(`Entry insert failed: ${insertError.code ?? "unknown"}`);
    return json(
      { ok: false, error: "Something went wrong creating your entry. Please try again." } satisfies ErrorBody,
      500,
    );
  }

  // ---- 3. Confirm it (service-role — the trigger forced verified=false) ----
  const { error: confirmError } = await admin
    .from("entries")
    .update({ verified: true, verified_at: new Date().toISOString() })
    .eq("email", input.email);

  if (confirmError) {
    // The row exists; only the confirm flip failed. Don't fail the user — a
    // later reconcile / the draw's verified filter is the backstop.
    console.error(`Entry confirm failed: ${confirmError.code ?? "unknown"}`);
  }

  return json({ ok: true, firstName: input.name.split(" ")[0] || "there" });
}
