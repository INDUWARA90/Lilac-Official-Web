import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const isDev = process.env.NODE_ENV === "development";

/**
 * Content-Security-Policy.
 *
 * Allowlist rationale:
 *  - Supabase       — the browser anon client (entry insert, funnel tracking)
 *  - Cloudflare     — the Turnstile script + its widget iframe
 *  - YouTube        — the ad embed (nocookie domain) + its thumbnails
 *  - Sentry         — browser error reports (only if a DSN is configured)
 *
 * `script-src` keeps `'unsafe-inline'`: the Next.js App Router injects inline
 * bootstrap/streaming scripts and we don't run a nonce middleware (kept simple).
 * Everything else is locked down — no framing, no plugins, self-only forms.
 * `'unsafe-eval'` is dev-only (Turbopack HMR).
 */
const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://challenges.cloudflare.com`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: https:`,
  `media-src 'self' blob: https://*.supabase.co`,
  `font-src 'self'`,
  `connect-src 'self' https://*.supabase.co https://challenges.cloudflare.com https://*.sentry.io`,
  `frame-src https://challenges.cloudflare.com https://www.youtube-nocookie.com https://www.youtube.com`,
  `frame-ancestors 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `object-src 'none'`,
  `upgrade-insecure-requests`,
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

/**
 * Wrap with Sentry. Inert unless NEXT_PUBLIC_SENTRY_DSN is set; source-map
 * upload also needs SENTRY_ORG / SENTRY_PROJECT / SENTRY_AUTH_TOKEN.
 */
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  // Don't fail the build when Sentry isn't configured.
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
});
