/**
 * Central access to environment variables.
 *
 * Reads are plain and non-throwing so that importing this module can never
 * crash a page render or a build. Enforcement happens at the point of use:
 *  - `requirePublic()` / `requireServer()` throw a clear error when a value that
 *    is genuinely needed for the current operation is missing.
 *  - The Supabase client factories call these, so a misconfigured deployment
 *    fails loudly the first time it tries to touch the database — not silently.
 *
 * `serverEnv` has no `NEXT_PUBLIC_` prefix on its secrets, so Next.js replaces
 * those references with `undefined` in any client bundle; never import it into a
 * Client Component.
 */

function clean(v: string | undefined): string {
  return (v ?? "").trim();
}

/** Safe in the browser — only NEXT_PUBLIC_* values. */
export const publicEnv = {
  supabaseUrl: clean(process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  siteUrl: clean(process.env.NEXT_PUBLIC_SITE_URL).replace(/\/$/, "") ||
    "http://localhost:3000",
};

/** SERVER ONLY. */
export const serverEnv = {
  supabaseServiceRoleKey: clean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  resend: {
    apiKey: clean(process.env.RESEND_API_KEY),
    senderEmail: clean(process.env.RESEND_SENDER_EMAIL),
    senderName: clean(process.env.RESEND_SENDER_NAME) || "Lilac",
  },
  adminNotifyEmail: clean(process.env.ADMIN_NOTIFY_EMAIL),

  // Admin panel: the single allowed admin email + password, and the secret used
  // to sign the admin session cookie.
  adminEmail: clean(process.env.ADMIN_EMAIL).toLowerCase(),
  adminPassword: clean(process.env.ADMIN_PASSWORD),
  adminSessionSecret: clean(process.env.ADMIN_SESSION_SECRET),

  // Signs the ad-watch session token (proves the sponsor ads were served and
  // that enough time elapsed before an entry). Falls back to the admin secret
  // so no new env var is strictly required.
  adSessionSecret:
    clean(process.env.AD_SESSION_SECRET) || clean(process.env.ADMIN_SESSION_SECRET),
};

export function requirePublic<K extends keyof typeof publicEnv>(
  key: K,
): string {
  const value = publicEnv[key];
  if (!value) {
    throw new Error(
      `Missing required public env var for "${key}". Add it to .env.local (see .env.example).`,
    );
  }
  return value;
}

export function requireServer(
  name: string,
  value: string,
): string {
  if (!value) {
    throw new Error(
      `Missing required server env var: ${name}. Add it to .env.local (see .env.example).`,
    );
  }
  return value;
}
