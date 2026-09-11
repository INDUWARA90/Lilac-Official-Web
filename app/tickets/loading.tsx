import { SiteFrame } from "@/components/ui/SiteFrame";

export default function TicketsLoading() {
  return (
    <SiteFrame>
      <div className="py-12">
        <div className="animate-pulse h-8 w-52 rounded-card bg-canvas-raised" />
        <div className="mt-3 animate-pulse h-4 w-full rounded-card bg-canvas-raised" />
        <div className="mt-8 animate-pulse h-72 w-full rounded-card bg-canvas-raised" />
      </div>
    </SiteFrame>
  );
}
