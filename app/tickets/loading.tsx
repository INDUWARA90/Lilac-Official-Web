import { SiteFrame } from "@/components/ui/SiteFrame";

export default function TicketsLoading() {
  return (
    <SiteFrame>
      <div className="py-12">
        <div className="lailac-skeleton h-8 w-52 rounded-card bg-canvas-raised" />
        <div className="mt-3 lailac-skeleton h-4 w-full rounded-card bg-canvas-raised" />
        <div className="mt-8 lailac-skeleton h-72 w-full rounded-card bg-canvas-raised" />
      </div>
    </SiteFrame>
  );
}
