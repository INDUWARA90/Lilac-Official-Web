import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/http";
import { TICKET_SLIP_BUCKET, MAX_SLIP_BYTES, ALLOWED_SLIP_TYPES } from "@/lib/tickets-shared";

/**
 * POST /api/tickets/upload-url — issue a one-time signed URL so a buyer can
 * upload their bank-transfer slip straight to the PRIVATE `ticket-slips`
 * bucket. Rate-limited; only the admin can read slips back (signed download).
 */
export const dynamic = "force-dynamic";

const schema = z.object({
  filename: z.string().min(1).max(200),
  size: z.number().int().positive(),
  contentType: z.enum(ALLOWED_SLIP_TYPES),
});

const json = (b: unknown, s = 200) => Response.json(b, { status: s });

export async function POST(req: Request) {
  const ip = getClientIp(req.headers);
  if (!(await checkRateLimit(`ticket-upload:${ip}`, 10, 10 * 60_000)).ok) {
    return json({ ok: false, error: "Too many attempts. Please wait a few minutes." }, 429);
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return json({ ok: false, error: "Choose a JPG, PNG, WebP or PDF of your bank slip." }, 400);
  }
  if (parsed.data.size > MAX_SLIP_BYTES) {
    return json(
      { ok: false, error: `That file is over ${Math.round(MAX_SLIP_BYTES / (1024 * 1024))} MB.` },
      400,
    );
  }

  const db = createAdminClient();
  // `allowedMimeTypes` is enforced by Storage itself at upload time — unlike
  // the zod check above, which only validates what the client *declares* it
  // will upload. Without this, a direct PUT to the signed URL could store any
  // file regardless of what was requested here. `updateBucket` re-applies it
  // even if the bucket already existed from before this was added.
  await db.storage.createBucket(TICKET_SLIP_BUCKET, {
    public: false,
    fileSizeLimit: MAX_SLIP_BYTES,
    allowedMimeTypes: [...ALLOWED_SLIP_TYPES],
  });
  const { error: bucketErr } = await db.storage.updateBucket(TICKET_SLIP_BUCKET, {
    public: false,
    fileSizeLimit: MAX_SLIP_BYTES,
    allowedMimeTypes: [...ALLOWED_SLIP_TYPES],
  });
  if (bucketErr) console.error(`ticket-slips bucket update failed: ${bucketErr.message}`);

  const ext =
    parsed.data.filename.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `slip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { data, error } = await db.storage.from(TICKET_SLIP_BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    console.error("ticket upload-url: createSignedUploadUrl failed");
    return json({ ok: false, error: "Could not start the upload. Try again." }, 500);
  }

  return json({ ok: true, bucket: TICKET_SLIP_BUCKET, path: data.path, token: data.token });
}
