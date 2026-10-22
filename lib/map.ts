import "server-only";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MapPlaceRow } from "@/lib/supabase/types";

export const MAP_PLACES_TAG = "map-places";

/**
 * Fetch all map places from Supabase.
 */
async function fetchMapPlaces(): Promise<MapPlaceRow[]> {
  const { data, error } = await createAdminClient()
    .from("map_places")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to load map places:", error);
    return [];
  }

  return data ?? [];
}

/**
 * Public cached read for map places.
 * Cached across requests using Next.js Data Cache to withstand traffic spikes.
 */
export const getCachedMapPlaces = unstable_cache(
  fetchMapPlaces,
  ["map-places-public"],
  {
    tags: [MAP_PLACES_TAG],
    revalidate: 120,
  },
);

/**
 * Live uncached read for the admin editor.
 */
export async function getLiveMapPlaces(): Promise<MapPlaceRow[]> {
  return fetchMapPlaces();
}

/**
 * Invalidate map places cache when an admin makes modifications.
 */
export function revalidateMapCache(): void {
  try {
    revalidateTag(MAP_PLACES_TAG, { expire: 0 });
    revalidatePath("/map", "page");
    revalidatePath("/admin/map", "page");
  } catch (err) {
    console.error("Failed to revalidate map cache:", err);
  }
}
