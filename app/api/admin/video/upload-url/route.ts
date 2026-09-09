import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { VIDEO_BUCKET, MAX_VIDEO_BYTES } from "@/lib/video-shared";

/**
 * POST /api/admin/video/upload-url — issue a one-time signed URL so the browser
 * can upload the video file straight to Supabase Storage (bypassing this
 * serverless function's request-body limit). The caller then saves the config
 * via POST /api/admin/video.
 */
export const dynamic = "force-dynamic";

const schema = z.object({
  filename: z.string().min(1).max(200),
  size: z.number().int().positive(),
  contentType: z.string().startsWith("video/"),
});

const json = (b: unknown, s = 200) => Response.json(b, { status: s });

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return json({ ok: false, error: "Not signed in." }, 401);

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return json({ ok: false, error: "Choose a video file." }, 400);
  }
  if (parsed.data.size > MAX_VIDEO_BYTES) {
    return json(
      { ok: false, error: "That file is over 20 MB. Use a smaller file or a YouTube link." },
      400,
    );
  }

  const db = createAdminClient();

  // Create the bucket on first use (public so the <video> tag can load it
  // directly). Ignore "already exists".
  await db.storage.createBucket(VIDEO_BUCKET, {
    public: true,
    fileSizeLimit: MAX_VIDEO_BYTES,
  });

  const ext = parsed.data.filename.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "mp4";
  const path = `ad-${Date.now()}.${ext}`;

  const { data, error } = await db.storage
    .from(VIDEO_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    console.error("video upload-url: createSignedUploadUrl failed");
    return json({ ok: false, error: "Could not start the upload. Try again." }, 500);
  }

  return json({ ok: true, bucket: VIDEO_BUCKET, path: data.path, token: data.token });
}
