import "server-only";
import { serverEnv } from "@/lib/env";

/**
 * Verify a Cloudflare Turnstile token server-side.
 *
 * Turnstile isn't provisioned yet (no keys). Behaviour until it is:
 *  - development / no secret key  → treated as passing, so the flow is testable
 *  - production / no secret key   → treated as FAILING (fail closed), so we
 *    never ship an unprotected form by forgetting to set the env var
 *
 * Once `TURNSTILE_SECRET_KEY` is set, this does a real siteverify call.
 */
const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstile(
  token: string,
  remoteIp?: string,
): Promise<{ ok: boolean; reason?: string }> {
  const secret = serverEnv.turnstileSecretKey;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return { ok: false, reason: "turnstile-not-configured" };
    }
    return { ok: true, reason: "dev-bypass" };
  }

  if (!token) return { ok: false, reason: "missing-token" };

  const body = new FormData();
  body.append("secret", secret);
  body.append("response", token);
  if (remoteIp && remoteIp !== "unknown") body.append("remoteip", remoteIp);

  try {
    const res = await fetch(SITEVERIFY_URL, { method: "POST", body });
    const data = (await res.json()) as {
      success: boolean;
      "error-codes"?: string[];
    };
    return data.success
      ? { ok: true }
      : { ok: false, reason: (data["error-codes"] ?? []).join(",") || "failed" };
  } catch {
    return { ok: false, reason: "siteverify-unreachable" };
  }
}
