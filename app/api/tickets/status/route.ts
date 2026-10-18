import { z } from "zod";
import { ticketStatusLookupSchema } from "@/lib/validation/ticket";
import { getPurchaseStatus, getTicketSettings } from "@/lib/tickets";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/http";

/** POST /api/tickets/status — buyer lookup by phone, email, or reference. */
export const dynamic = "force-dynamic";

const json = (b: unknown, s = 200) => Response.json(b, { status: s });

export async function POST(req: Request) {
  if (!(await getTicketSettings()).ticketLinksVisible) {
    return json({ ok: false, error: "Ticket status lookup is unavailable." }, 404);
  }
  const ip = getClientIp(req.headers);
  if (!(await checkRateLimit(`ticket-status:${ip}`, 15, 10 * 60_000)).ok) {
    return json({ ok: false, error: "Too many attempts. Please wait a few minutes." }, 429);
  }

  const parsed = ticketStatusLookupSchema.safeParse(await req.json().catch(() => null));
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

  const purchases = await getPurchaseStatus(parsed.data.lookup);
  if (purchases.length === 0) {
    return json(
      {
        ok: false,
        error: "We couldn't find a purchase with that phone number, email, or reference.",
      },
      404,
    );
  }

  return json({ ok: true, purchases });
}
