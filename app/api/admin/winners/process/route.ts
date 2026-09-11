import { after } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { serverEnv } from "@/lib/env";
import {
  processWinnerEmailBatch,
  triggerWinnerEmailProcessor,
  alertOnWinnerEmailFailures,
} from "@/lib/winner-emails";

/**
 * POST /api/admin/winners/process — drain the pending winner-email queue.
 *
 * Responds immediately; the batch runs in `after()`. If work remains it
 * re-triggers itself, so a draw of any size drains without any single
 * invocation getting near the timeout.
 *
 * Auth: an admin session cookie (the manual "Send pending" button) OR the
 * internal key header (the self-trigger / the draw route).
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await getAdminSession();
  const key = req.headers.get("x-internal-key");
  const secret = serverEnv.adminSessionSecret;
  const authed =
    (Boolean(session) && session?.role === "admin") || (Boolean(secret) && key === secret);
  if (!authed) {
    return Response.json({ ok: false, error: "Not authorised." }, { status: 401 });
  }

  const origin = new URL(req.url).origin;

  after(async () => {
    const result = await processWinnerEmailBatch();
    if (result.remaining > 0) {
      await triggerWinnerEmailProcessor(origin);
    } else {
      await alertOnWinnerEmailFailures();
    }
  });

  return Response.json({ ok: true, queued: true });
}
