"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { MapPlaceRow } from "@/lib/supabase/types";
import { CATEGORY_CONFIG } from "@/lib/map-config";
import { SvgMap } from "@/components/map/SvgMap";
import { MapPlaceCard } from "@/components/map/MapPlaceCard";
import { MapLoadingSkeleton } from "@/components/map/MapLoadingSkeleton";

const ThreeMap = dynamic(() => import("@/components/map/ThreeMap"), {
  ssr: false,
  loading: () => <MapLoadingSkeleton />,
});

interface InteractiveEventMapProps {
  initialPlaces: MapPlaceRow[];
}

export function InteractiveEventMap({ initialPlaces }: InteractiveEventMapProps) {
  const [places] = useState<MapPlaceRow[]>(initialPlaces);
  const [selectedPlace, setSelectedPlace] = useState<MapPlaceRow | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Lazy initialization of WebGL capability and initial view mode
  const [hasWebGL] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      const canvas = document.createElement("canvas");
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
      );
    } catch {
      return false;
    }
  });

  const [viewMode, setViewMode] = useState<"3d" | "2d">(() => {
    if (typeof window === "undefined") return "3d";
    try {
      const canvas = document.createElement("canvas");
      const gl =
        window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
      return gl ? "3d" : "2d";
    } catch {
      return "2d";
    }
  });

  const handleSelectPlace = (place: MapPlaceRow | null) => {
    setSelectedPlace(place);
  };

  const handleFocusPlace = (place: MapPlaceRow) => {
    setSelectedPlace(place);
  };

  return (
    <div className="flex w-full flex-col gap-4">
      {/* Top Controls Toolbar: Category Filter Pills + View Mode Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5" role="tablist">
          <button
            type="button"
            onClick={() => setFilterCategory("all")}
            className={`rounded-pill border px-3 py-1.5 text-xs font-medium transition-colors ${
              filterCategory === "all"
                ? "border-accent bg-accent text-canvas"
                : "border-hairline bg-canvas text-ink-muted hover:border-accent/40 hover:text-ink"
            }`}
          >
            All places ({places.length})
          </button>

          {(Object.keys(CATEGORY_CONFIG) as Array<keyof typeof CATEGORY_CONFIG>).map(
            (cat) => {
              const meta = CATEGORY_CONFIG[cat];
              const count = places.filter((p) => p.category === cat).length;
              const isActive = filterCategory === cat;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterCategory(cat)}
                  className={`inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "border-accent bg-accent-wash text-accent-strong"
                      : "border-hairline bg-canvas text-ink-muted hover:border-accent/30 hover:text-ink"
                  }`}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: meta.dotColor }}
                  />
                  <span>
                    {meta.label} ({count})
                  </span>
                </button>
              );
            },
          )}
        </div>

        {/* View Switcher: 3D Scene / 2D Simple View */}
        <div className="flex items-center gap-1 rounded-pill border border-hairline bg-canvas p-1 shadow-xs">
          <button
            type="button"
            disabled={!hasWebGL}
            onClick={() => setViewMode("3d")}
            className={`flex items-center gap-1.5 rounded-pill px-3 py-1 text-xs font-medium transition-all ${
              viewMode === "3d" && hasWebGL
                ? "bg-accent text-canvas shadow-xs"
                : hasWebGL
                  ? "text-ink-muted hover:text-ink"
                  : "cursor-not-allowed opacity-40 text-ink-muted"
            }`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            <span>3D map</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("2d")}
            className={`flex items-center gap-1.5 rounded-pill px-3 py-1 text-xs font-medium transition-all ${
              viewMode === "2d" || !hasWebGL
                ? "bg-accent text-canvas shadow-xs"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
            <span>Simple view</span>
          </button>
        </div>
      </div>

      {!hasWebGL && (
        <div className="rounded-field border border-hairline bg-canvas-raised px-3 py-2 text-xs text-ink-muted">
          3D graphics are unavailable on this device. Displaying the 2D top-down map view.
        </div>
      )}

      {/* Main Map Viewer Canvas */}
      <div className="relative h-[68vh] min-h-[500px] w-full overflow-hidden rounded-card border border-hairline bg-canvas-raised shadow-xs sm:h-[75vh]">
        {/* Render 3D Scene when WebGL is available */}
        {hasWebGL && (
          <div
            className={`absolute inset-0 h-full w-full transition-opacity duration-200 ${
              viewMode === "3d"
                ? "pointer-events-auto opacity-100 z-10"
                : "pointer-events-none opacity-0 z-0"
            }`}
          >
            <ThreeMap
              places={places}
              selectedPlace={selectedPlace}
              onSelectPlace={handleSelectPlace}
              filteredCategory={filterCategory}
            />
          </div>
        )}

        {/* Render 2D SVG Map */}
        <div
          className={`absolute inset-0 h-full w-full transition-opacity duration-200 ${
            viewMode === "2d" || !hasWebGL
              ? "pointer-events-auto opacity-100 z-10"
              : "pointer-events-none opacity-0 z-0"
          }`}
        >
          <SvgMap
            places={places}
            selectedPlace={selectedPlace}
            onSelectPlace={handleSelectPlace}
            filteredCategory={filterCategory}
          />
        </div>

        {/* Floating Scene Controls Hints (top right) */}
        <div className="pointer-events-none absolute top-4 right-4 z-20 hidden rounded-field border border-hairline bg-canvas/90 px-3 py-2 text-[11px] text-ink-muted shadow-sm backdrop-blur-xs md:block">
          {viewMode === "3d" && hasWebGL ? (
            <div className="space-y-0.5">
              <p>• Rotate: Drag 1 finger / Left mouse</p>
              <p>• Pan: 2 fingers / Right mouse</p>
              <p>• Zoom: Pinch / Scroll</p>
            </div>
          ) : (
            <p>• Tap any place pin to inspect details</p>
          )}
        </div>

        {/* Quick Place Selector Dropdown */}
        <div className="absolute top-4 left-4 z-20 max-w-[220px]">
          <label htmlFor="quick-place-select" className="sr-only">
            Jump to a place
          </label>
          <select
            id="quick-place-select"
            value={selectedPlace?.id ?? ""}
            onChange={(e) => {
              const found = places.find((p) => p.id === e.target.value);
              setSelectedPlace(found ?? null);
            }}
            className="w-full rounded-field border border-hairline bg-canvas/95 px-3 py-1.5 text-xs text-ink shadow-sm backdrop-blur-xs transition-colors focus:border-accent focus:outline-none"
          >
            <option value="">Jump to a place...</option>
            {places.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({CATEGORY_CONFIG[p.category].singular})
              </option>
            ))}
          </select>
        </div>

        {/* Detail Card Overlay: Bottom Sheet on small screens, floating card on desktop */}
        {selectedPlace && (
          <div className="fixed inset-x-4 bottom-4 z-30 sm:absolute sm:inset-x-auto sm:top-14 sm:left-4 sm:bottom-auto">
            <MapPlaceCard
              place={selectedPlace}
              onClose={() => setSelectedPlace(null)}
              onFocus={handleFocusPlace}
            />
          </div>
        )}
      </div>
    </div>
  );
}
