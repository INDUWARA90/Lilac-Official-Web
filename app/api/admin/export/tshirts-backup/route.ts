import { ZipArchive } from "archiver";
import { PassThrough } from "node:stream";
import { getAdminSession } from "@/lib/auth";
import { toCsv } from "@/lib/csv";
import { TSHIRT_RECEIPT_BUCKET } from "@/lib/tshirts-shared";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAll } from "@/lib/supabase/fetch-all";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type BackupFile = { name: string; data: Buffer };

function receiptFileName(
  registrationNumber: string,
  path: string,
  disambiguator?: string,
): string {
  const safeRegistrationNumber = registrationNumber.replace(/[^a-zA-Z0-9_-]/g, "_") || "no-registration";
  const safeDisambiguator = disambiguator
    ? `-${disambiguator.replace(/[^a-zA-Z0-9_-]/g, "_") || "order"}`
    : "";
  const sourceExtension = path.match(/\.(pdf|jpe?g|png|webp)$/i)?.[0].toLowerCase();
  const extension = sourceExtension === ".jpeg" ? ".jpg" : sourceExtension ?? ".bin";
  return `receipts/${safeRegistrationNumber}${safeDisambiguator}${extension}`;
}

async function createZip(files: BackupFile[]): Promise<Buffer> {
  const archive = new ZipArchive({ zlib: { level: 6 } });
  const output = new PassThrough();
  const chunks: Buffer[] = [];
  archive.pipe(output);

  const complete = new Promise<Buffer>((resolve, reject) => {
    output.on("data", (chunk: Buffer) => chunks.push(chunk));
    output.once("end", () => resolve(Buffer.concat(chunks)));
    output.once("error", reject);
    archive.once("error", reject);
  });

  for (const file of files) archive.append(file.data, { name: file.name });
  await archive.finalize();
  return complete;
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) return Response.json({ ok: false, error: "Not signed in." }, { status: 401 });
  if (session.role !== "admin" && session.role !== "tshirt_manager") {
    return Response.json({ ok: false, error: "Not authorised." }, { status: 403 });
  }

  const db = createAdminClient();
  const { data: orders, error } = await fetchAll((from, to) =>
    db
      .from("tshirt_orders")
      .select(
        "id, reference, name, registration_number, faculty, email, phone, tshirt_size, quantity, order_items, amount_lkr, paid_amount_lkr, receipt_path, status, review_note, collected_by, collected_at, created_at",
      )
      .order("created_at", { ascending: true })
      .order("id")
      .range(from, to),
  );

  if (error) {
    return Response.json({ ok: false, error: "Backup failed while loading T-shirt orders." }, { status: 500 });
  }

  const receiptCounts = new Map<string, number>();
  for (const order of orders) {
    if (order.receipt_path) {
      receiptCounts.set(
        order.registration_number,
        (receiptCounts.get(order.registration_number) ?? 0) + 1,
      );
    }
  }

  function orderReceiptName(order: (typeof orders)[number]): string {
    const isDuplicateRegistration = (receiptCounts.get(order.registration_number) ?? 0) > 1;
    return receiptFileName(
      order.registration_number,
      order.receipt_path,
      isDuplicateRegistration ? `${order.reference}-${order.id}` : undefined,
    );
  }

  const files: BackupFile[] = [
    {
      name: "tshirt-orders.csv",
      data: Buffer.from(
        toCsv(
          [
            "reference", "name", "registration_number", "faculty", "email", "phone",
            "shirt_variants", "quantity", "amount_lkr", "paid_amount_lkr", "balance_due_lkr",
            "status", "review_note", "collected_by", "collected_at", "created_at", "receipt_file",
          ],
          orders.map((order) => [
            order.reference, order.name, order.registration_number, order.faculty,
            order.email, order.phone,
            order.order_items?.length
              ? order.order_items.map((item) => `${item.color} / ${item.size}`).join("; ")
              : `Size ${order.tshirt_size}; color not recorded`,
            order.quantity, order.amount_lkr, order.paid_amount_lkr,
            order.paid_amount_lkr === null
              ? ""
              : Math.max(0, order.amount_lkr - order.paid_amount_lkr),
            order.status, order.review_note, order.collected_by, order.collected_at,
            order.created_at,
            order.receipt_path ? orderReceiptName(order) : "",
          ]),
        ),
      ),
    },
  ];

  for (const order of orders) {
    if (!order.receipt_path) continue;
    const name = orderReceiptName(order);
    const { data, error: downloadError } = await db.storage
      .from(TSHIRT_RECEIPT_BUCKET)
      .download(order.receipt_path);
    if (downloadError || !data) {
      return Response.json(
        { ok: false, error: `Backup failed because the receipt for order ${order.reference} could not be downloaded.` },
        { status: 500 },
      );
    }
    files.push({ name, data: Buffer.from(await data.arrayBuffer()) });
  }

  try {
    const body = await createZip(files);
    const stamp = new Date().toISOString().slice(0, 10);
    const responseBody = new Uint8Array(body.byteLength);
    responseBody.set(body);
    return new Response(responseBody, {
      headers: {
        "content-type": "application/zip",
        "content-length": String(responseBody.byteLength),
        "content-disposition": `attachment; filename="lailac-tshirt-orders-backup-${stamp}.zip"`,
        "cache-control": "no-store",
      },
    });
  } catch {
    return Response.json({ ok: false, error: "T-shirt backup archive could not be created." }, { status: 500 });
  }
}
