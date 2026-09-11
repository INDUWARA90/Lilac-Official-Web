import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { parseYouTubeId, VIDEO_BUCKET, IMAGE_BUCKET } from "@/lib/ads-shared";

/**
 * POST /api/admin/ads — manage the ordered list of sponsor ads.
 *
 *   { action: "create_youtube", url, title }
 *   { action: "create_video_file", path, title }   — path from /upload-url
 *   { action: "create_image", path, title }        — path from /upload-url
 *   { action: "update_title", id, title }
 *   { action: "delete", id }
 *   { action: "reorder", order: [id, id, ...] }     — full new id order
 */
export const dynamic = "force-dynamic";

const titleSchema = z.string().trim().min(1).max(120);

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create_youtube"), url: z.string().min(1), title: titleSchema }),
  z.object({ action: z.literal("create_video_file"), path: z.string().min(1).max(200), title: titleSchema }),
  z.object({ action: z.literal("create_image"), path: z.string().min(1).max(200), title: titleSchema }),
  z.object({ action: z.literal("update_title"), id: z.uuid(), title: titleSchema }),
  z.object({ action: z.literal("delete"), id: z.uuid() }),
  z.object({ action: z.literal("reorder"), order: z.array(z.uuid()).min(1) }),
]);

const json = (b: unknown, s = 200) => Response.json(b, { status: s });

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return json({ ok: false, error: "Not signed in." }, 401);
  if (session.role !== "admin") return json({ ok: false, error: "Not authorised." }, 403);

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ ok: false, error: "Invalid request." }, 400);
  const input = parsed.data;
  const db = createAdminClient();

  if (input.action === "reorder") {
    const results = await Promise.all(
      input.order.map((id, i) =>
        db.from("ads").update({ sort_order: i, updated_at: new Date().toISOString() }).eq("id", id),
      ),
    );
    if (results.some((r) => r.error)) {
      console.error("ads reorder: one or more updates failed");
      return json({ ok: false, error: "Could not save the new order. Try again." }, 500);
    }
    await logAudit("ad.reorder", { order: input.order, by: session.email }, null);
    return json({ ok: true });
  }

  if (input.action === "update_title") {
    const { error } = await db
      .from("ads")
      .update({ title: input.title, updated_at: new Date().toISOString() })
      .eq("id", input.id);
    if (error) return json({ ok: false, error: "Could not save. Try again." }, 500);
    await logAudit("ad.update_title", { id: input.id, title: input.title, by: session.email }, null);
    return json({ ok: true });
  }

  if (input.action === "delete") {
    const { data: existing } = await db
      .from("ads")
      .select("kind, storage_path")
      .eq("id", input.id)
      .maybeSingle();

    const { error } = await db.from("ads").delete().eq("id", input.id);
    if (error) return json({ ok: false, error: "Could not remove. Try again." }, 500);

    // Best-effort cleanup of the uploaded file — never block on this.
    if (existing?.storage_path) {
      const bucket = existing.kind === "image" ? IMAGE_BUCKET : VIDEO_BUCKET;
      await db.storage.from(bucket).remove([existing.storage_path]).catch(() => {});
    }

    await logAudit("ad.delete", { id: input.id, by: session.email }, null);
    return json({ ok: true });
  }

  // --- create_youtube / create_video_file / create_image -----------------

  let row: {
    kind: "youtube" | "video_file" | "image";
    youtube_id: string | null;
    storage_path: string | null;
    title: string;
  };

  if (input.action === "create_youtube") {
    const youtubeId = parseYouTubeId(input.url);
    if (!youtubeId) {
      return json({ ok: false, error: "That doesn't look like a YouTube link." }, 400);
    }
    row = { kind: "youtube", youtube_id: youtubeId, storage_path: null, title: input.title };
  } else {
    const isImage = input.action === "create_image";
    const bucket = isImage ? IMAGE_BUCKET : VIDEO_BUCKET;
    const { data: exists } = await db.storage.from(bucket).list("", { search: input.path });
    if (!exists?.some((o) => o.name === input.path)) {
      return json({ ok: false, error: "Uploaded file not found. Please upload again." }, 400);
    }
    row = {
      kind: isImage ? "image" : "video_file",
      youtube_id: null,
      storage_path: input.path,
      title: input.title,
    };
  }

  const { count } = await db.from("ads").select("id", { count: "exact", head: true });
  const { error } = await db.from("ads").insert({ ...row, sort_order: count ?? 0, updated_by: null });

  if (error) {
    console.error("ads create failed");
    return json({ ok: false, error: "Could not save. Try again." }, 500);
  }

  await logAudit(
    "ad.create",
    { kind: row.kind, youtube_id: row.youtube_id, storage_path: row.storage_path, by: session.email },
    null,
  );

  return json({ ok: true });
}
