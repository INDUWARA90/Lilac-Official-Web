import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFrame } from "@/components/ui/SiteFrame";
import { Reveal } from "@/components/ui/decor/Reveal";
import { Sparkle } from "@/components/ui/decor/Sparkle";
import { getCachedMapPlaces } from "@/lib/map";
import { getPublicMapVisible } from "@/lib/app-config";
import { InteractiveEventMap } from "@/components/map/InteractiveEventMap";

export const metadata: Metadata = {
  title: "Event Map · Lilac",
  description:
    "Interactive 3D campus event ground map for Lilac. Discover stages, stalls, food spots, and event facilities.",
};

export default async function MapPage() {
  const mapVisible = await getPublicMapVisible();
  if (!mapVisible) {
    notFound();
  }

  const places = await getCachedMapPlaces();

  return (
    <SiteFrame>
      <div className="py-8 sm:py-12">
        <Reveal>
          <div className="mb-6 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-pill border border-accent/20 bg-accent-wash px-3 py-0.5 text-xs font-medium text-accent-strong">
                <Sparkle />
                Interactive campus grounds
              </span>
            </div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Event grounds map
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-ink-muted">
              Rotate, tilt and zoom to explore the 3D university campus ground. Tap
              any booth, stage, or refreshment spot to inspect details and location.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <InteractiveEventMap initialPlaces={places} />
        </Reveal>
      </div>
    </SiteFrame>
  );
}
