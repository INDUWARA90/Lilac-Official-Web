import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAds } from "@/lib/ads";

export interface AdAnalyticsRow {
  id: string;
  title: string;
  kind: string;
  shown: number;
  watched: number;
  completionPct: number;
}

export interface SiteAnalytics {
  perAd: AdAnalyticsRow[];
  verifiedEntries: number;
  flowSessionsStarted: number;
  flowSessionsCompleted: number;
  ticketBuyers: number;
}

/**
 * Site-wide interaction numbers plus a per-ad breakdown (shown/watched/
 * completion), for the admin Analytics page and its CSV export.
 *
 * Per-ad counts are exact `count` queries (two per ad) rather than pulling raw
 * event rows: a plain select is capped at 1000 rows, which would silently
 * under-report a busy ad. The number of ads is small, so this stays cheap.
 */
export async function getSiteAnalytics(): Promise<SiteAnalytics> {
  const db = createAdminClient();
  const head = { count: "exact", head: true } as const;

  const [ads, entriesTotal, ticketsApproved, flowViews, flowCompletes] = await Promise.all([
    getAds(),
    db.from("entries").select("*", head).eq("verified", true),
    db.from("ticket_purchases").select("id", head).eq("status", "approved"),
    db.from("events").select("*", head).eq("type", "ad_view"),
    db.from("events").select("*", head).eq("type", "ad_complete"),
  ]);

  const adCount = (type: "ad_shown" | "ad_watched", adId: string) =>
    db.from("events").select("*", head).eq("type", type).eq("ad_id", adId);

  // The fallback "default" ad isn't a real `ads` row (see AdsStep.tsx), so it
  // has no events to count.
  const counts = await Promise.all(
    ads.map(async (ad) => {
      if (ad.id === "default") return { shown: 0, watched: 0 };
      const [shown, watched] = await Promise.all([
        adCount("ad_shown", ad.id),
        adCount("ad_watched", ad.id),
      ]);
      return { shown: shown.count ?? 0, watched: watched.count ?? 0 };
    }),
  );

  const perAd: AdAnalyticsRow[] = ads.map((ad, i) => {
    const c = counts[i];
    return {
      id: ad.id,
      title: ad.title,
      kind: ad.kind,
      shown: c.shown,
      watched: c.watched,
      completionPct: c.shown ? Math.round((c.watched / c.shown) * 100) : 0,
    };
  });

  return {
    perAd,
    verifiedEntries: entriesTotal.count ?? 0,
    flowSessionsStarted: flowViews.count ?? 0,
    flowSessionsCompleted: flowCompletes.count ?? 0,
    ticketBuyers: ticketsApproved.count ?? 0,
  };
}
