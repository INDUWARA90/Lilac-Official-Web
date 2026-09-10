import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_ADS,
  VIDEO_BUCKET,
  IMAGE_BUCKET,
  type Ad,
} from "@/lib/ads-shared";

/**
 * Resolve the ordered list of sponsor ads for the public flow. Reads every row
 * from `ads` (service-role), sorted by `sort_order`. Falls back to
 * DEFAULT_ADS if none are configured yet.
 */
export async function getAds(): Promise<Ad[]> {
  const db = createAdminClient();
  const { data } = await db
    .from("ads")
    .select("id, kind, youtube_id, storage_path, title")
    .order("sort_order", { ascending: true });

  if (!data || data.length === 0) return DEFAULT_ADS;

  return data.map((row): Ad => {
    if (row.kind === "video_file" && row.storage_path) {
      const { data: pub } = db.storage.from(VIDEO_BUCKET).getPublicUrl(row.storage_path);
      return { id: row.id, title: row.title, kind: "video_file", url: pub.publicUrl };
    }
    if (row.kind === "image" && row.storage_path) {
      const { data: pub } = db.storage.from(IMAGE_BUCKET).getPublicUrl(row.storage_path);
      return { id: row.id, title: row.title, kind: "image", url: pub.publicUrl };
    }
    if (row.kind === "youtube" && row.youtube_id) {
      return { id: row.id, title: row.title, kind: "youtube", youtubeId: row.youtube_id };
    }
    // Incomplete row (shouldn't normally happen) — fall back to the default clip.
    return { ...DEFAULT_ADS[0], id: row.id, title: row.title || DEFAULT_ADS[0].title };
  });
}
