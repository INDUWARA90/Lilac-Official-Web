import { z } from "zod";
import { contactInputSchema } from "@/lib/validation/contact";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/http";
import { sendContactMessage } from "@/lib/email/brevo";

/**
 * POST /api/contact — forward a contact-form message to the admin inbox.
 * No database table: the message is emailed and not stored.
 */
export const dynamic = "force-dynamic";

const json = (b: unknown, s = 200) => Response.json(b, { status: s });

export async function POST(req: Request) {
  const ip = getClientIp(req.headers);
  if (!(await checkRateLimit(`contact:${ip}`, 5, 10 * 60_000)).ok) {
    return json({ ok: false, error: "Too many messages. Please try again later." }, 429);
  }

  const parsed = contactInputSchema.safeParse(await req.json().catch(() => null));
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
  const input = parsed.data;

  const sent = await sendContactMessage({
    name: input.name,
    email: input.email,
    message: input.message,
  });
  if (!sent.ok) {
    return json(
      { ok: false, error: "We couldn't send your message just now. Please try again shortly." },
      502,
    );
  }

  return json({ ok: true });
}
