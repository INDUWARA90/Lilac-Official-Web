import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { markTshirtHandedOver, markTshirtNotHandedOver, reviewTshirtOrder } from "@/lib/tshirts";
export const dynamic = "force-dynamic";
const schema = z.object({ action: z.enum(["collect", "collect_balance", "reject", "handover", "undo_handover"]), orderId: z.uuid(), note: z.string().trim().max(500).optional() });
export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return Response.json({ ok: false, error: "Not signed in." }, { status: 401 });
  if (session.role !== "admin" && session.role !== "tshirt_manager") {
    return Response.json({ ok: false, error: "Not authorised." }, { status: 403 });
  }
  const input = schema.safeParse(await req.json().catch(() => null));
  if (!input.success) return Response.json({ ok: false, error: "Invalid request." }, { status: 400 });
  const result = input.data.action === "handover"
    ? await markTshirtHandedOver(input.data.orderId, session.email)
    : input.data.action === "undo_handover"
      ? await markTshirtNotHandedOver(input.data.orderId)
      : await reviewTshirtOrder(input.data.orderId, input.data.action, session.email, input.data.note);
  return Response.json(result, { status: result.ok ? 200 : 400 });
}
