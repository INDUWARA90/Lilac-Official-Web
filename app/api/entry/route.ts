import { z } from "zod";
import { entryInputSchema } from "@/lib/validation/entry";
import { createAnonClient } from "@/lib/supabase/client";
import { verifyTurnstile } from "@/lib/turnstile";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/http";
import { sendVerificationEmail } from "@/lib/email/brevo";
import { publicEnv } from "@/lib/env";

/**
 * POST /api/entry — create an UNVERIFIED raffle entry and email a confirmation link.
 *
 * Flow:
 *   1. rate-limit + Turnstile + zod        (cheap rejections first)
 *   2. INSERT the row via the anon client  (RLS: INSERT-only on `entries`)
 *        - unique violation → 409 "already entered", and no email is sent,
 *          so this endpoint can't be used to spam a victim's inbox.
 *   3. send the verification email (best effort — a provider hiccup doesn't
 *      lose the entry; the row already exists unverified).
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
  if (!checkRateLimit(`entry:${ip}`, 8, 10 * 60_000).ok) {
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

  // ---- 1c. Turnstile -------------------------------------------------
  const turnstile = await verifyTurnstile(input.turnstileToken, ip);
  if (!turnstile.ok) {
    return json(
      { ok: false, error: "Bot check failed. Please refresh the page and try again." } satisfies ErrorBody,
      400,
    );
  }

  // ---- server-controlled values ------------------------------------
  const verificationToken = crypto.randomUUID();
  const verifyUrl = `${publicEnv.siteUrl}/verify?token=${verificationToken}`;

  // adWatchedAt: accept only a sane, non-future timestamp.
  let adWatchedAt: string | null = null;
  if (input.adWatchedAt) {
    const t = new Date(input.adWatchedAt);
    if (!Number.isNaN(t.getTime()) && t.getTime() <= Date.now() + 60_000) {
      adWatchedAt = t.toISOString();
    }
  }

  // ---- 2. Insert the unverified entry -----------------------------
  const supabase = createAnonClient();
  const { error: insertError } = await supabase.from("entries").insert({
    name: input.name,
    email: input.email,
    phone: input.phone,
    address: input.address,
    age_range: input.ageRange,
    gender: input.gender,
    occupation: input.occupation ? input.occupation : null,
    district: input.district,
    consent_at: new Date().toISOString(),
    ad_watched_at: adWatchedAt,
    verification_token: verificationToken,
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

  // ---- 3. Send the verification email (best effort) ------------
  const mail = await sendVerificationEmail({
    to: input.email,
    name: input.name,
    verifyUrl,
  });
  // `emailSent: false` lets the UI tell the user to expect a delay / check spam,
  // but the entry is saved either way.
  return json({ ok: true, emailSent: mail.ok });
}
