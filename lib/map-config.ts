import type { MapCategory } from "@/lib/supabase/types";

/**
 * Central ground configuration for the 3D campus map and 2D SVG editor/fallback.
 * Designed to make swapping the real organizer ground layout / aerial texture simple.
 */
export const GROUND_CONFIG = {
  // World dimension units
  width: 90,
  depth: 90,
  minX: -42,
  maxX: 42,
  minZ: -42,
  maxZ: 42,

  // Visual tones matching Lilac style
  groundColor: "#f7f5fa",
  pavementColor: "#ece7f4",
  lawnColor: "#e5ece2",
  hairlineColor: "#ded7ea",
  borderRingColor: "#c9bedb",

  // Base ground texture overlay (when organizers supply aerial photo or CAD plan)
  textureUrl: null as string | null,
} as const;

export interface CategoryMeta {
  label: string;
  singular: string;
  color: string;
  hoverColor: string;
  lightBg: string;
  badgeClass: string;
  dotColor: string;
}

export const CATEGORY_CONFIG: Record<MapCategory, CategoryMeta> = {
  stage: {
    label: "Stages & Arena",
    singular: "Stage",
    color: "#5a45d6",
    hoverColor: "#45329f",
    lightBg: "#f1eefc",
    badgeClass: "bg-accent/10 text-accent-strong border-accent/25",
    dotColor: "#5a45d6",
  },
  stall: {
    label: "Stalls & Exhibits",
    singular: "Stall",
    color: "#7765b8",
    hoverColor: "#6150a0",
    lightBg: "#f5f3fb",
    badgeClass: "bg-[#7765b8]/10 text-[#534190] border-[#7765b8]/30",
    dotColor: "#7765b8",
  },
  food: {
    label: "Food & Drinks",
    singular: "Food & Drink",
    color: "#99538a",
    hoverColor: "#7f3d71",
    lightBg: "#faf2f8",
    badgeClass: "bg-[#99538a]/10 text-[#7c306e] border-[#99538a]/30",
    dotColor: "#99538a",
  },
};

/**
 * Placeholder campus landscaping features (walkways, lawns, trees)
 * that give spatial context until the final aerial photo/plan is delivered.
 */
export const CAMPUS_FEATURES = {
  lawns: [
    { x: 26, z: -18, w: 22, d: 20 },
    { x: -25, z: 16, w: 22, d: 24 },
    { x: 22, z: 18, w: 22, d: 22 },
  ],
  paths: [
    // Main North-South spine
    { x: 0, z: 0, w: 6, d: 80 },
    // East-West crosswalk
    { x: 0, z: 0, w: 80, d: 6 },
    // Circular central plaza ring around main stage
    { x: 0, z: 0, radius: 14 },
    // South main entrance walkway
    { x: 0, z: -38, w: 12, d: 8 },
  ],
  entrance: {
    label: "Campus Main Gate",
    x: 0,
    z: -42,
  },
  trees: [
    { x: -36, z: -36 },
    { x: -36, z: -20 },
    { x: -36, z: 0 },
    { x: -36, z: 24 },
    { x: -36, z: 36 },
    { x: 36, z: -36 },
    { x: 36, z: -4 },
    { x: 36, z: 36 },
    { x: -18, z: -36 },
    { x: 18, z: -36 },
    { x: -20, z: 36 },
    { x: 20, z: 36 },
    { x: 30, z: -4 },
    { x: -32, z: -10 },
  ],
};
