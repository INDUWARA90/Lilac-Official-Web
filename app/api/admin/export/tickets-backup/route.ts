import { ZipArchive } from "archiver";
import { PassThrough } from "node:stream";
import { getAdminSession } from "@/lib/auth";
import { toCsv } from "@/lib/csv";
import { TICKET_SLIP_BUCKET } from "@/lib/tickets-shared";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAll } from "@/lib/supabase/fetch-all";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type BackupFile = { name: string; data: Buffer };

function slipFileName(
  registrationNumber: string,
  path: string,
  disambiguator?: string,
): string {
  const safeRegistrationNumber =
    registrationNumber.replace(/[^a-zA-Z0-9_-]/g, "_") || "no-registration";
  const safeDisambiguator = disambiguator
    ? `-${disambiguator.replace(/[^a-zA-Z0-9_-]/g, "_") || "purchase"}`
    : "";
  const extension = path.match(/\.(pdf|jpe?g|png|webp)$/i)?.[0].toLowerCase();
  return `slips/${safeRegistrationNumber}${safeDisambiguator}${extension === ".jpeg" ? ".jpg" : extension ?? ".bin"}`;
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
  if (session.role !== "admin" && session.role !== "ticket_manager") {
    return Response.json({ ok: false, error: "Not authorised." }, { status: 403 });
  }

  const db = createAdminClient();
  const { data: purchases, error } = await fetchAll((from, to) =>
    db
      .from("ticket_purchases")
      .select(
        "id, reference, name, registration_number, faculty, email, phone, ticket_type, ticket_types, quantity, amount_lkr, slip_path, status, review_note, reviewed_by, reviewed_at, created_at",
      )
      .order("created_at", { ascending: true })
      .order("id")
      .range(from, to),
  );

  if (error) {
    return Response.json(
      { ok: false, error: "Backup failed while loading ticket purchases." },
      { status: 500 },
    );
  }

  const slipCounts = new Map<string, number>();
  for (const purchase of purchases) {
    if (!purchase.slip_path) continue;
    const safeRegistrationNumber =
      purchase.registration_number.replace(/[^a-zA-Z0-9_-]/g, "_") || "no-registration";
    slipCounts.set(
      safeRegistrationNumber,
      (slipCounts.get(safeRegistrationNumber) ?? 0) + 1,
    );
  }

  function purchaseSlipName(purchase: (typeof purchases)[number]): string {
    const safeRegistrationNumber =
      purchase.registration_number.replace(/[^a-zA-Z0-9_-]/g, "_") || "no-registration";
    const isDuplicateRegistration = (slipCounts.get(safeRegistrationNumber) ?? 0) > 1;
    return slipFileName(
      purchase.registration_number,
      purchase.slip_path,
      isDuplicateRegistration ? `${purchase.reference}-${purchase.id}` : undefined,
    );
  }

  const files: BackupFile[] = [
    {
      name: "ticket-purchases.csv",
      data: Buffer.from(
        toCsv(
          [
            "reference",
            "name",
            "registration_number",
            "faculty",
            "email",
            "phone",
            "ticket_types",
            "quantity",
            "amount_lkr",
            "status",
            "review_note",
            "reviewed_by",
            "reviewed_at",
            "created_at",
            "slip_file",
          ],
          purchases.map((purchase) => [
            purchase.reference,
            purchase.name,
            purchase.registration_number,
            purchase.faculty,
            purchase.email,
            purchase.phone,
            purchase.ticket_types?.length
              ? purchase.ticket_types.join("; ")
              : purchase.ticket_type,
            purchase.quantity,
            purchase.amount_lkr,
            purchase.status,
            purchase.review_note,
            purchase.reviewed_by,
            purchase.reviewed_at,
            purchase.created_at,
            purchase.slip_path ? purchaseSlipName(purchase) : "",
          ]),
        ),
      ),
    },
  ];

  for (const purchase of purchases) {
    if (!purchase.slip_path) continue;
    const name = purchaseSlipName(purchase);
    const { data, error: downloadError } = await db.storage
      .from(TICKET_SLIP_BUCKET)
      .download(purchase.slip_path);
    if (downloadError || !data) {
      return Response.json(
        {
          ok: false,
          error: `Backup failed because the slip for purchase ${purchase.reference} could not be downloaded.`,
        },
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
        "content-disposition": `attachment; filename="lailac-ticket-purchases-backup-${stamp}.zip"`,
        "cache-control": "no-store",
      },
    });
  } catch {
    return Response.json(
      { ok: false, error: "Ticket backup archive could not be created." },
      { status: 500 },
    );
  }
}
