import { SiteFrame } from "@/components/ui/SiteFrame";

/**
 * Instant fallback while `/enter` resolves the sponsor ads + issues an
 * ad-watch session token server-side. That token is minted fresh per request
 * (see lib/ad-session.ts) so this route stays `force-dynamic` — it can't be
 * cached — but the nav/footer chrome and a skeleton can still show instantly
 * instead of leaving the browser on a blank tab while Supabase responds.
 */
export default function EnterLoading() {
  return (
    <SiteFrame>
      <div className="py-12">
        <div className="animate-pulse aspect-video w-full rounded-card bg-canvas-raised" />
        <div className="mt-6 animate-pulse h-4 w-2/3 rounded-card bg-canvas-raised" />
      </div>
    </SiteFrame>
  );
}
