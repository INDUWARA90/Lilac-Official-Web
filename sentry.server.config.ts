import * as Sentry from "@sentry/nextjs";

/**
 * Server-side Sentry (Node runtime). Loaded from instrumentation.ts.
 * Completely inert unless NEXT_PUBLIC_SENTRY_DSN is set.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    enabled: process.env.NODE_ENV === "production",
    tracesSampleRate: 0.1,
    // Brief: don't send full PII to third-party services.
    sendDefaultPii: false,
  });
}
