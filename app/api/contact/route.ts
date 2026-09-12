import { z } from "zod";
import { contactInputSchema } from "@/lib/validation/contact";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/http";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/contact — store a contact-form message for the admin to read at
 * /admin/messages. No email — same self-service-over-push-notification model
 * as the ticket flow. Inserted via the service-role client (rate-limited +
 * zod-validated here first), same as entries/events/tickets.
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

  const { error } = await createAdminClient().from("contact_messages").insert({
    name: input.name,
    email: input.email,
    message: input.message,
  });
  if (error) {
    console.error(`contact message insert failed: ${error.code ?? "unknown"}`);
    return json(
      { ok: false, error: "We couldn't send your message just now. Please try again shortly." },
      500,
    );
  }

  return json({ ok: true });
}
