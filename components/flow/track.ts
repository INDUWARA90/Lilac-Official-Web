/**
 * Fire a funnel event once per browser session (so a refresh doesn't
 * double-count). Best effort — failures are ignored.
 */
export function track(type: "ad_view" | "ad_complete"): void {
  try {
    const key = `lilac_tracked_${type}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    // sessionStorage unavailable (private mode etc.) — still send once.
  }
  fetch("/api/track", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ type }),
    keepalive: true,
  }).catch(() => {});
}
