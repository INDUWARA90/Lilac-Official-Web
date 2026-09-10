import { z } from "zod";
import { ticketPurchaseSchema } from "@/lib/validation/ticket";
import { createPurchase } from "@/lib/tickets";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/http";

/**
 * POST /api/tickets — create a ticket purchase (status `pending_review`).
 * Capacity is enforced atomically in the `create_ticket_purchase` RPC.
 */
export const dynamic = "force-dynamic";

const json = (b: unknown, s = 200) => Response.json(b, { status: s });

export async function POST(req: Request) {
  const ip = getClientIp(req.headers);
  if (!(await checkRateLimit(`ticket-buy:${ip}`, 6, 10 * 60_000)).ok) {
    return json({ ok: false, error: "Too many attempts. Please wait a few minutes." }, 429);
  }

  const parsed = ticketPurchaseSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return json(
      {
        ok: false,
        error: "Please correct the highlighted fields.",
        fieldErrors: z.flattenError(parsed.error).fieldErrors,
      },
      400,
    );
  }

  const result = await createPurchase(parsed.data);
  if (!result.ok) {
    return json({ ok: false, error: result.error }, result.soldOut ? 409 : 400);
  }
  return json({ ok: true, reference: result.reference });
}
