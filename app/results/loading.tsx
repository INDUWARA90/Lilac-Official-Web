import { SiteFrame } from "@/components/ui/SiteFrame";

export default function ResultsLoading() {
  return (
    <SiteFrame>
      <div className="py-12">
        <div className="animate-pulse h-8 w-40 rounded-card bg-canvas-raised" />
        <div className="mt-4 animate-pulse h-6 w-56 rounded-card bg-canvas-raised" />
        <hr className="my-8 border-hairline" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse h-5 w-full rounded-card bg-canvas-raised" />
          ))}
        </div>
      </div>
    </SiteFrame>
  );
}
