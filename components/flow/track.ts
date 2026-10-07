/**
 * Fire a funnel/analytics event once per browser session per (type, ad)
 * pair — so a refresh doesn't double-count, but each individual ad in a
 * multi-ad flow still gets its own 'ad_shown'/'ad_watched' count. Best
 * effort — failures are ignored.
 */
export function track(
  type: "ad_view" | "ad_complete" | "ad_shown" | "ad_watched",
  adId?: string,
): void {
  try {
    const key = `lailac_tracked_${type}${adId ? `_${adId}` : ""}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    // sessionStorage unavailable (private mode etc.) — still send once.
  }
  fetch("/api/track", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(adId ? { type, adId } : { type }),
    keepalive: true,
  }).catch(() => {});
}
