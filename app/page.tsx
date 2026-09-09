import { SiteFrame } from "@/components/ui/SiteFrame";
import { EntryExperience } from "@/components/flow/EntryExperience";
import { getVideoConfig } from "@/lib/video";

/**
 * Home — the whole public flow (ad → form → confirm) lives here, per the brief.
 * This stays a Server Component so metadata/layout are server-rendered and the
 * ad video config is resolved server-side; the interactive flow is the
 * `<EntryExperience />` client island.
 */
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const video = await getVideoConfig();
  return (
    <SiteFrame>
      <EntryExperience video={video} />
    </SiteFrame>
  );
}
