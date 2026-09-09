"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/** Catches errors in the root layout. Reports to Sentry (inert without a DSN). */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100dvh",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          textAlign: "center",
          color: "#211b26",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#6c6577", fontSize: "0.9rem" }}>
            Please refresh the page and try again.
          </p>
        </div>
      </body>
    </html>
  );
}
