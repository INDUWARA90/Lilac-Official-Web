import "server-only";
import { cache } from "react";
import { unstable_cache, revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Single-row `app_config` — app-wide flags read/written server-side.
 */

const DRAW_UNLOCKED_TAG = "draw-unlocked";

async function fetchDrawUnlocked(): Promise<boolean> {
  const { data } = await createAdminClient()
    .from("app_config")
    .select("draw_unlocked")
    .eq("id", "default")
    .maybeSingle();
  return data?.draw_unlocked ?? false;
}

/**
 * `AdminShell` reads this for the sidebar on every admin page, and several
 * pages (dashboard, draw) also need it for their own content. Wrapped in
 * React's `cache()` so repeated calls within one request share a single
 * Supabase round trip instead of firing it again — and so a page can call it
 * unawaited right after `requireAdmin()` purely to kick the fetch off in
 * parallel with its other queries, letting `AdminShell`'s later call resolve
 * from cache instead of adding a serial round trip after the page's own data
 * is already in. Always live (per-request) — admin actions need the real
 * value, not a stale cached one.
 */
export const getDrawUnlocked = cache(fetchDrawUnlocked);

/**
 * Public-site read: does `SiteNav` show the "Results" link yet? Unlike
 * `getDrawUnlocked` above, this is cached across requests (Next's Data
 * Cache, not per-request) — the public nav renders on every page via
 * `SiteFrame`, so this must not cost a live Supabase round trip on every
 * view. Revalidates at most every 60s, and instantly the moment an admin
 * actually flips the lock (`revalidateTag` in `setDrawUnlocked` below).
 */
export const getPublicDrawUnlocked = unstable_cache(fetchDrawUnlocked, ["draw-unlocked"], {
  tags: [DRAW_UNLOCKED_TAG],
  revalidate: 60,
});

export async function setDrawUnlocked(unlocked: boolean, by: string): Promise<boolean> {
  const { error } = await createAdminClient()
    .from("app_config")
    .update({ draw_unlocked: unlocked, updated_at: new Date().toISOString(), updated_by: by })
    .eq("id", "default");
  // `{ expire: 0 }` — no stale-while-revalidate window: the very next request
  // for this tag blocks on a fresh read, so the nav reflects the flip right
  // away rather than serving up to a year of stale data (the `"max"` profile
  // Next recommends for content where that's fine, which this isn't).
  if (!error) revalidateTag(DRAW_UNLOCKED_TAG, { expire: 0 });
  return !error;
}
