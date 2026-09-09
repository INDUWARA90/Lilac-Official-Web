import * as Sentry from "@sentry/nextjs";

/** Edge runtime Sentry. Loaded from instrumentation.ts. Inert without a DSN. */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    enabled: process.env.NODE_ENV === "production",
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  });
}
