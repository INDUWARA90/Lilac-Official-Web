import type { Metadata } from "next";
import { requireFullAdmin } from "@/lib/auth";
import { getLiveMapPlaces } from "@/lib/map";
import { getDrawUnlocked, getMapVisible } from "@/lib/app-config";
import { AdminShell } from "@/components/admin/AdminShell";
import { MapEditor } from "@/components/admin/MapEditor";
import { MapVisibilityToggle } from "@/components/admin/MapVisibilityToggle";

export const metadata: Metadata = {
  title: "Campus Map · Admin",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function AdminMapPage() {
  const session = await requireFullAdmin();
  const [places, mapVisible] = await Promise.all([
    getLiveMapPlaces(),
    getMapVisible(),
    getDrawUnlocked(),
  ]);

  return (
    <AdminShell email={session.email}>
      <div className="mb-6">
        <h1 className="text-2xl text-ink">Campus event map</h1>
        <p className="mt-1 font-sans text-sm text-ink-muted">
          Manage stalls, stages, and food areas on the university campus ground.
          Click anywhere on the ground to place a spot, or drag markers to reposition
          them. Coordinates drive both the public 3D scene and the 2D top-down fallback.
        </p>
      </div>

      <div className="mb-6">
        <MapVisibilityToggle initialVisible={mapVisible} />
      </div>

      <MapEditor initialPlaces={places} />
    </AdminShell>
  );
}
