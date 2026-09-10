import type { Metadata } from "next";
import { SiteFrame } from "@/components/ui/SiteFrame";
import { EntryExperience } from "@/components/flow/EntryExperience";
import { getAds } from "@/lib/ads";
import { issueAdSession } from "@/lib/ad-session";

/**
 * The raffle flow (ads → form → confirm). This is where the event QR code
 * should point. The sponsor ads are resolved server-side and a signed
 * ad-watch session token is issued here — `/api/entry` refuses any submission
 * without a valid, old-enough, unused token.
 */
export const metadata: Metadata = { title: "Enter the draw" };
export const dynamic = "force-dynamic";

export default async function EnterPage() {
  const ads = await getAds();
  const adSession = issueAdSession(ads.length);

  return (
    <SiteFrame>
      <EntryExperience ads={ads} adSession={adSession} />
    </SiteFrame>
  );
}
