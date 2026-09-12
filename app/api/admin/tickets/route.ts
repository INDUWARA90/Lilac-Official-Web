import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import {
  approvePurchase,
  rejectPurchase,
  checkInTicket,
  undoCheckIn,
  updateTicketSettings,
} from "@/lib/tickets";

/**
 * POST /api/admin/tickets — ticket-purchase review + settings.
 *
 *   { action: "approve", purchaseId }
 *   { action: "reject", purchaseId, note? }
 *   { action: "checkin" | "undo_checkin", token }
 *   { action: "update_settings", priceLkr?, capacity?, salesOpen?, bank*? }
 */
export const dynamic = "force-dynamic";

const json = (b: unknown, s = 200) => Response.json(b, { status: s });

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve"), purchaseId: z.uuid() }),
  z.object({
    action: z.literal("reject"),
    purchaseId: z.uuid(),
    note: z.string().trim().max(500).optional(),
  }),
  z.object({ action: z.literal("checkin"), token: z.string().min(1).max(200) }),
  z.object({ action: z.literal("undo_checkin"), token: z.string().min(1).max(200) }),
  z.object({
    action: z.literal("update_settings"),
    priceLkr: z.coerce.number().int().min(0).max(1_000_000).optional(),
    capacity: z.coerce.number().int().min(0).max(100_000).optional(),
    salesOpen: z.boolean().optional(),
    bankName: z.string().trim().max(120).optional(),
    bankAccountName: z.string().trim().max(120).optional(),
    bankAccountNumber: z.string().trim().max(60).optional(),
    bankBranch: z.string().trim().max(120).optional(),
    bankInstructions: z.string().trim().max(500).optional(),
  }),
]);

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return json({ ok: false, error: "Not signed in." }, 401);

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ ok: false, error: "Invalid request." }, 400);
  const input = parsed.data;

  if (input.action === "approve") {
    const r = await approvePurchase(input.purchaseId, session.email);
    return r.ok ? json({ ok: true }) : json({ ok: false, error: r.error }, 400);
  }
  if (input.action === "reject") {
    const r = await rejectPurchase(input.purchaseId, session.email, input.note ?? "");
    return r.ok ? json({ ok: true }) : json({ ok: false, error: r.error }, 400);
  }
  if (input.action === "checkin") {
    const r = await checkInTicket(input.token, session.email);
    return r.ok
      ? json({ ok: true })
      : json({ ok: false, error: r.error, alreadyAt: r.alreadyAt }, 409);
  }
  if (input.action === "undo_checkin") {
    const r = await undoCheckIn(input.token, session.email);
    return r.ok ? json({ ok: true }) : json({ ok: false, error: r.error }, 400);
  }

  // update_settings changes price/capacity/bank details — full admin only.
  // The ticket manager can review purchases and check people in, not touch
  // the money settings.
  if (session.role !== "admin") {
    return json({ ok: false, error: "Not authorised." }, 403);
  }

  const ok = await updateTicketSettings(
    {
      priceLkr: input.priceLkr,
      capacity: input.capacity,
      salesOpen: input.salesOpen,
      bankName: input.bankName,
      bankAccountName: input.bankAccountName,
      bankAccountNumber: input.bankAccountNumber,
      bankBranch: input.bankBranch,
      bankInstructions: input.bankInstructions,
    },
    session.email,
  );
  return ok ? json({ ok: true }) : json({ ok: false, error: "Could not save settings." }, 500);
}
