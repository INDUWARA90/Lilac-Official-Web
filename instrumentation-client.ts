import * as Sentry from "@sentry/nextjs";

/** Browser-side Sentry. Inert unless NEXT_PUBLIC_SENTRY_DSN is set. */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    enabled: process.env.NODE_ENV === "production",
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    // No Session Replay — it could capture form field values (PII).
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
