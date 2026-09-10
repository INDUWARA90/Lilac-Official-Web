import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Content-Security-Policy.
 *
 * Allowlist rationale:
 *  - Supabase       — the browser anon client (entry insert, funnel tracking)
 *  - YouTube        — the ad embed (nocookie domain) + its thumbnails, and the
 *                     IFrame Player API script (`youtube.com`, `s.ytimg.com`)
 *                     used to gate video ads on real watch time
 *
 * `script-src` keeps `'unsafe-inline'`: the Next.js App Router injects inline
 * bootstrap/streaming scripts and we don't run a nonce middleware (kept simple).
 * Everything else is locked down — no framing, no plugins, self-only forms.
 * `'unsafe-eval'` is dev-only (Turbopack HMR).
 */
const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline' https://www.youtube.com https://s.ytimg.com${isDev ? " 'unsafe-eval'" : ""}`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: https:`,
  `media-src 'self' blob: https://*.supabase.co`,
  // The YouTube IFrame player spins up a same-origin blob worker for playback.
  `worker-src 'self' blob:`,
  `font-src 'self'`,
  `connect-src 'self' https://*.supabase.co`,
  `frame-src https://www.youtube-nocookie.com https://www.youtube.com`,
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

export default nextConfig;
