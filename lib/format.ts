/**
 * Shared date/time display helpers — client-safe (no imports, no server-only
 * deps), used from both Server Components and "use client" components.
 *
 * Every one pins `timeZone: "Asia/Colombo"` explicitly. Without it,
 * `toLocaleString()` etc. use whatever timezone the *rendering* environment
 * defaults to — for a Server Component that's the server's OS timezone, which
 * on Vercel is UTC, not Sri Lanka. That's exactly why a check-in at 11:39 AM
 * local time was showing as "06:09 AM" (UTC, 5:30 behind) — this file exists
 * so no call site can silently regress into that bug again.
 */
const TIME_ZONE = "Asia/Colombo";

/** e.g. "9/12/2026, 11:39:00 AM" */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-LK", { timeZone: TIME_ZONE });
}

/** e.g. "9/12/2026" */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-LK", { timeZone: TIME_ZONE });
}

/** e.g. "11:39 AM" */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-LK", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** e.g. "11:39 AM, 12 Sep" — used on check-in scan screens. */
export function formatTimeAndDate(iso: string): string {
  return new Date(iso).toLocaleString("en-LK", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  });
}
