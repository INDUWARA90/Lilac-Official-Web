"use client";

import { useMemo } from "react";
import type { MapPlaceRow } from "@/lib/supabase/types";
import { GROUND_CONFIG, CATEGORY_CONFIG, CAMPUS_FEATURES } from "@/lib/map-config";

interface SvgMapProps {
  places: MapPlaceRow[];
  selectedPlace: MapPlaceRow | null;
  onSelectPlace: (place: MapPlaceRow | null) => void;
  filteredCategory: string;
}

export function SvgMap({
  places,
  selectedPlace,
  onSelectPlace,
  filteredCategory,
}: SvgMapProps) {
  const visiblePlaces = useMemo(() => {
    if (filteredCategory === "all") return places;
    return places.filter((p) => p.category === filteredCategory);
  }, [places, filteredCategory]);

  return (
    <div
      className="relative flex h-full w-full items-center justify-center p-2 sm:p-4"
      onClick={() => onSelectPlace(null)}
    >
      <div className="relative aspect-square w-full max-w-[620px] overflow-hidden rounded-card border border-hairline bg-canvas shadow-inner">
        <svg
          viewBox="-46 -46 92 92"
          className="h-full w-full select-none"
          aria-label="2D Campus Event Map"
        >
          {/* Subtle grid pattern for scale and precision */}
          <defs>
            <pattern
              id="campus-grid"
              width="10"
              height="10"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 10 0 L 0 0 0 10"
                fill="none"
                stroke="var(--color-hairline)"
                strokeWidth="0.15"
                strokeOpacity="0.7"
              />
            </pattern>
          </defs>

          {/* Base ground slab */}
          <rect
            x="-44"
            y="-44"
            width="88"
            height="88"
            rx="4"
            fill={GROUND_CONFIG.groundColor}
          />
          <rect
            x="-44"
            y="-44"
            width="88"
            height="88"
            rx="4"
            fill="url(#campus-grid)"
          />

          {/* Campus border ring */}
          <rect
            x="-42"
            y="-42"
            width="84"
            height="84"
            rx="3"
            fill="none"
            stroke={GROUND_CONFIG.borderRingColor}
            strokeWidth="0.4"
            strokeDasharray="2 1"
          />

          {/* Green lawn zones */}
          {CAMPUS_FEATURES.lawns.map((lawn, i) => (
            <rect
              key={i}
              x={lawn.x - lawn.w / 2}
              y={lawn.z - lawn.d / 2}
              width={lawn.w}
              height={lawn.d}
              rx="2"
              fill={GROUND_CONFIG.lawnColor}
              stroke="var(--color-hairline)"
              strokeWidth="0.2"
            />
          ))}

          {/* Walkways */}
          {/* North-South spine */}
          <rect
            x="-3"
            y="-40"
            width="6"
            height="80"
            fill={GROUND_CONFIG.pavementColor}
          />
          {/* East-West crosswalk */}
          <rect
            x="-40"
            y="-3"
            width="80"
            height="6"
            fill={GROUND_CONFIG.pavementColor}
          />
          {/* Central plaza circle */}
          <circle
            cx="0"
            cy="0"
            r="14"
            fill={GROUND_CONFIG.pavementColor}
            stroke="var(--color-hairline)"
            strokeWidth="0.25"
          />

          {/* Trees */}
          {CAMPUS_FEATURES.trees.map((tree, i) => (
            <g key={i} transform={`translate(${tree.x}, ${tree.z})`}>
              <circle r="1.6" fill="#7a9379" opacity="0.85" />
              <circle r="1.0" fill="#8ba58a" opacity="0.9" />
            </g>
          ))}

          {/* Main Entrance at South */}
          <g transform={`translate(${CAMPUS_FEATURES.entrance.x}, ${CAMPUS_FEATURES.entrance.z})`}>
            <rect
              x="-5"
              y="-1"
              width="10"
              height="2"
              rx="0.5"
              fill="#5a45d6"
              opacity="0.9"
            />
            <text
              y="3.2"
              textAnchor="middle"
              className="fill-ink-muted text-[2.2px] font-sans font-medium"
            >
              Main Entrance Gate
            </text>
          </g>

          {/* Compass / Orientation indicator */}
          <g transform="translate(38, -38)">
            <circle r="3.2" fill="white" stroke="var(--color-hairline)" strokeWidth="0.3" />
            <polygon points="0,-2.4 1.2,0.8 0,0 -1.2,0.8" fill="#5a45d6" />
            <polygon points="0,2.4 1.2,0.8 0,0 -1.2,0.8" fill="#c9bedb" />
            <text
              y="-3.8"
              textAnchor="middle"
              className="fill-accent-strong text-[2px] font-semibold"
            >
              N
            </text>
          </g>

          {/* Places markers */}
          {visiblePlaces.map((place) => {
            const isSelected = selectedPlace?.id === place.id;
            const meta = CATEGORY_CONFIG[place.category];

            return (
              <g
                key={place.id}
                transform={`translate(${place.position_x}, ${place.position_z})`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPlace(place);
                }}
                className="cursor-pointer transition-transform duration-150"
              >
                {/* Touch / Click target padding */}
                <circle r="5" fill="transparent" />

                {/* Selection pulse ring */}
                {isSelected && (
                  <circle
                    r="4.2"
                    fill="none"
                    stroke={meta.color}
                    strokeWidth="0.6"
                    className="animate-pulse"
                  />
                )}

                {/* Place pin circle */}
                <circle
                  r={isSelected ? 3.0 : 2.4}
                  fill={meta.color}
                  stroke="#ffffff"
                  strokeWidth="0.5"
                  className="filter drop-shadow-sm transition-all"
                />

                {/* Place Category Icon/Symbol inside pin */}
                {place.category === "stage" && (
                  <polygon
                    points="-1,-1 1.2,0 -1,1"
                    fill="#ffffff"
                    transform="scale(0.8)"
                  />
                )}
                {place.category === "stall" && (
                  <rect
                    x="-1.1"
                    y="-1.1"
                    width="2.2"
                    height="2.2"
                    rx="0.3"
                    fill="#ffffff"
                    transform="scale(0.7)"
                  />
                )}
                {place.category === "food" && (
                  <circle r="1" fill="#ffffff" transform="scale(0.8)" />
                )}

                {/* Place Name Label */}
                <text
                  y={isSelected ? "4.8" : "4.4"}
                  textAnchor="middle"
                  className={`pointer-events-none select-none text-[2.1px] font-sans font-medium transition-all ${
                    isSelected
                      ? "fill-accent-strong font-bold"
                      : "fill-ink"
                  }`}
                  style={{
                    textShadow:
                      "0 1px 2px rgba(255, 255, 255, 0.95), 0 -1px 2px rgba(255, 255, 255, 0.95)",
                  }}
                >
                  {place.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
