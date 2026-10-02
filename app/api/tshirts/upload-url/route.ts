import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/http";
import { ALLOWED_RECEIPT_TYPES, MAX_RECEIPT_BYTES, TSHIRT_RECEIPT_BUCKET } from "@/lib/tshirts-shared";

export const dynamic = "force-dynamic";
const schema = z.object({ filename: z.string().min(1).max(200), size: z.number().int().positive(), contentType: z.enum(ALLOWED_RECEIPT_TYPES) });

export async function POST(req: Request) {
  if (!(await checkRateLimit(`tshirt-upload:${getClientIp(req.headers)}`, 10, 10 * 60_000)).ok) return Response.json({ ok: false, error: "Too many attempts. Please wait a few minutes." }, { status: 429 });
  const input = schema.safeParse(await req.json().catch(() => null));
  if (!input.success || input.data.size > MAX_RECEIPT_BYTES) return Response.json({ ok: false, error: "Choose a JPG, PNG, WebP or PDF up to 5 MB." }, { status: 400 });
  const db = createAdminClient();
  await db.storage.createBucket(TSHIRT_RECEIPT_BUCKET, { public: false, fileSizeLimit: MAX_RECEIPT_BYTES, allowedMimeTypes: [...ALLOWED_RECEIPT_TYPES] });
  await db.storage.updateBucket(TSHIRT_RECEIPT_BUCKET, { public: false, fileSizeLimit: MAX_RECEIPT_BYTES, allowedMimeTypes: [...ALLOWED_RECEIPT_TYPES] });
  const ext = input.data.filename.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const { data, error } = await db.storage.from(TSHIRT_RECEIPT_BUCKET).createSignedUploadUrl(`receipt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`);
  if (error || !data) return Response.json({ ok: false, error: "Could not start the upload." }, { status: 500 });
  return Response.json({ ok: true, bucket: TSHIRT_RECEIPT_BUCKET, path: data.path, token: data.token });
}
