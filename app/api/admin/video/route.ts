import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { parseYouTubeId, VIDEO_BUCKET } from "@/lib/video-shared";

/**
 * POST /api/admin/video — save the current ad video.
 *
 *   { kind: "youtube", url, title }   — a YouTube link (preferred: zero Supabase bandwidth)
 *   { kind: "file", path, title }     — a file already uploaded via /upload-url
 */
export const dynamic = "force-dynamic";

const schema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("youtube"),
    url: z.string().min(1),
    title: z.string().trim().min(1).max(120),
  }),
  z.object({
    kind: z.literal("file"),
    path: z.string().min(1).max(200),
    title: z.string().trim().min(1).max(120),
  }),
]);

const json = (b: unknown, s = 200) => Response.json(b, { status: s });

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return json({ ok: false, error: "Not signed in." }, 401);

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ ok: false, error: "Invalid request." }, 400);
  const input = parsed.data;
  const db = createAdminClient();

  let row: {
    kind: "youtube" | "file";
    youtube_id: string | null;
    storage_path: string | null;
    title: string;
  };

  if (input.kind === "youtube") {
    const youtubeId = parseYouTubeId(input.url);
    if (!youtubeId) {
      return json({ ok: false, error: "That doesn't look like a YouTube link." }, 400);
    }
    row = { kind: "youtube", youtube_id: youtubeId, storage_path: null, title: input.title };
  } else {
    // Confirm the object actually exists in the bucket.
    const { data: exists } = await db.storage
      .from(VIDEO_BUCKET)
      .list("", { search: input.path });
    if (!exists?.some((o) => o.name === input.path)) {
      return json({ ok: false, error: "Uploaded file not found. Please upload again." }, 400);
    }
    row = { kind: "file", youtube_id: null, storage_path: input.path, title: input.title };
  }

  const { error } = await db
    .from("video_config")
    .update({ ...row, updated_at: new Date().toISOString(), updated_by: null })
    .eq("id", "default");

  if (error) {
    console.error("video config update failed");
    return json({ ok: false, error: "Could not save. Try again." }, 500);
  }

  await logAudit(
    "video.update",
    { kind: row.kind, youtube_id: row.youtube_id, storage_path: row.storage_path, by: session.email },
    null,
  );

  return json({ ok: true });
}
