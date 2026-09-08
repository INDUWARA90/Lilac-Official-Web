/**
 * Central, fail-fast access to environment variables.
 *
 * Why a module instead of reading `process.env` inline everywhere:
 *  - one place that documents every var the app needs
 *  - a missing server secret throws at first use with a clear message, instead
 *    of a confusing `undefined` reaching the Supabase / email SDKs
 *  - the `serverEnv` getter is never imported into a Client Component, so the
 *    service-role key and API secrets can't accidentally be bundled for the
 *    browser
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Add it to .env.local (see .env.example).`,
    );
  }
  return value;
}

/** Safe to use in the browser — only NEXT_PUBLIC_* values. */
export const publicEnv = {
  supabaseUrl: required(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  ),
  supabaseAnonKey: required(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ),
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000",
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "",
};

/**
 * SERVER ONLY. Importing this into a Client Component will fail the build,
 * because the referenced vars have no NEXT_PUBLIC_ prefix and Next.js replaces
 * them with `undefined` on the client — `required()` then throws.
 */
export const serverEnv = {
  supabaseServiceRoleKey: required(
    "SUPABASE_SERVICE_ROLE_KEY",
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  ),
  brevo: {
    apiKey: process.env.BREVO_API_KEY ?? "",
    senderEmail: process.env.BREVO_SENDER_EMAIL ?? "",
    senderName: process.env.BREVO_SENDER_NAME ?? "Lilac",
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY ?? "",
    senderEmail: process.env.RESEND_SENDER_EMAIL ?? "",
    senderName: process.env.RESEND_SENDER_NAME ?? "Lilac",
  },
  adminNotifyEmail: process.env.ADMIN_NOTIFY_EMAIL ?? "",
  turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY ?? "",
};
