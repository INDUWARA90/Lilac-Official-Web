import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_VIDEO,
  VIDEO_BUCKET,
  type VideoConfig,
} from "@/lib/video-shared";

/**
 * Resolve the current ad video for the public flow. Reads the single
 * `video_config` row (service-role). Falls back to DEFAULT_VIDEO if the row is
 * missing or incomplete.
 */
export async function getVideoConfig(): Promise<VideoConfig> {
  const db = createAdminClient();
  const { data } = await db
    .from("video_config")
    .select("kind, youtube_id, storage_path, title")
    .eq("id", "default")
    .maybeSingle();

  if (!data) return DEFAULT_VIDEO;

  if (data.kind === "file" && data.storage_path) {
    const { data: pub } = db.storage
      .from(VIDEO_BUCKET)
      .getPublicUrl(data.storage_path);
    return { kind: "file", url: pub.publicUrl, title: data.title };
  }

  if (data.kind === "youtube" && data.youtube_id) {
    return { kind: "youtube", youtubeId: data.youtube_id, title: data.title };
  }

  return { ...DEFAULT_VIDEO, title: data.title || DEFAULT_VIDEO.title };
}
