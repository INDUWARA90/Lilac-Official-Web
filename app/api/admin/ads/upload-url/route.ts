import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { VIDEO_BUCKET, IMAGE_BUCKET, MAX_VIDEO_BYTES, MAX_IMAGE_BYTES } from "@/lib/ads-shared";

/**
 * POST /api/admin/ads/upload-url — issue a one-time signed URL so the browser
 * can upload a video or image file straight to Supabase Storage (bypassing
 * this serverless function's request-body limit). The caller then saves the ad
 * via POST /api/admin/ads.
 */
export const dynamic = "force-dynamic";

const schema = z.object({
  filename: z.string().min(1).max(200),
  size: z.number().int().positive(),
  contentType: z.string().regex(/^(video|image)\//),
});

const json = (b: unknown, s = 200) => Response.json(b, { status: s });

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return json({ ok: false, error: "Not signed in." }, 401);

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return json({ ok: false, error: "Choose a file." }, 400);
  }

  const isVideo = parsed.data.contentType.startsWith("video/");
  const bucket = isVideo ? VIDEO_BUCKET : IMAGE_BUCKET;
  const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;

  if (parsed.data.size > maxBytes) {
    return json(
      { ok: false, error: `That file is over ${Math.round(maxBytes / (1024 * 1024))} MB.` },
      400,
    );
  }

  const db = createAdminClient();

  // Create the bucket on first use (public so <video>/<img> can load it
  // directly). Ignore "already exists".
  await db.storage.createBucket(bucket, { public: true, fileSizeLimit: maxBytes });

  const fallbackExt = isVideo ? "mp4" : "jpg";
  const ext =
    parsed.data.filename.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || fallbackExt;
  const path = `ad-${Date.now()}.${ext}`;

  const { data, error } = await db.storage.from(bucket).createSignedUploadUrl(path);

  if (error || !data) {
    console.error("ads upload-url: createSignedUploadUrl failed");
    return json({ ok: false, error: "Could not start the upload. Try again." }, 500);
  }

  return json({ ok: true, bucket, path: data.path, token: data.token });
}
