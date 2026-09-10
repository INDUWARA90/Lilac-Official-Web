"use client";

/**
 * Root error boundary — the last-resort UI when the root layout itself throws.
 * Next.js passes `{ error, reset }`; this screen needs neither.
 */
export default function GlobalError() {
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
