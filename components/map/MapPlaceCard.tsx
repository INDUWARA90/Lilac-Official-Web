"use client";

import type { MapPlaceRow } from "@/lib/supabase/types";
import { CATEGORY_CONFIG } from "@/lib/map-config";

interface MapPlaceCardProps {
  place: MapPlaceRow | null;
  onClose: () => void;
  onFocus?: (place: MapPlaceRow) => void;
}

export function MapPlaceCard({ place, onClose, onFocus }: MapPlaceCardProps) {
  if (!place) return null;

  const categoryMeta = CATEGORY_CONFIG[place.category];

  return (
    <div
      role="dialog"
      aria-labelledby="place-card-title"
      className="pointer-events-auto w-full max-w-sm rounded-card border border-hairline bg-canvas/95 p-5 shadow-xl backdrop-blur-md transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-0.5 text-xs font-medium ${categoryMeta.badgeClass}`}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: categoryMeta.dotColor }}
          />
          {categoryMeta.singular}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close place details"
          className="rounded-field border border-transparent p-1 text-ink-muted hover:border-hairline hover:text-ink transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="mt-3">
        <h3
          id="place-card-title"
          className="font-serif text-lg font-semibold tracking-tight text-ink"
        >
          {place.name}
        </h3>

        <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-accent-strong">
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
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>{place.location_tag}</span>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          {place.description}
        </p>
      </div>

      {onFocus && (
        <div className="mt-4 flex items-center justify-end gap-2 border-t border-hairline/60 pt-3">
          <button
            type="button"
            onClick={() => onFocus(place)}
            className="rounded-field border border-hairline px-3 py-1.5 text-xs font-medium text-accent hover:border-accent hover:text-accent-strong transition-colors"
          >
            Focus place
          </button>
        </div>
      )}
    </div>
  );
}
