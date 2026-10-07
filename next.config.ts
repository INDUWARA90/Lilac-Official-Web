import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const csp = [
  "default-src 'self'",

  // Next.js + YouTube
  `script-src 'self' 'unsafe-inline' ${
    isDev ? "'unsafe-eval'" : ""
  } https://www.youtube.com https://s.ytimg.com blob:`,

  // Tailwind / Next.js
  "style-src 'self' 'unsafe-inline'",

  // Images
  "img-src 'self' data: blob: https:",

  // YouTube / Supabase media
  "media-src 'self' blob: https://*.supabase.co https://*.youtube.com",

  // YouTube player workers
  "worker-src 'self' blob:",

  // Fonts
  "font-src 'self' data: https:",

  // Supabase + YouTube
  "connect-src 'self' https://*.supabase.co https://*.youtube.com https://*.googlevideo.com",

  // YouTube iframe
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com",

  // Prevent clickjacking
  "frame-ancestors 'none'",

  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",

  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: csp,
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;