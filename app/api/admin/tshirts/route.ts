import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { reviewTshirtOrder } from "@/lib/tshirts";
export const dynamic = "force-dynamic";
const schema = z.object({ action: z.enum(["collect", "reject"]), orderId: z.uuid(), note: z.string().trim().max(500).optional() });
export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return Response.json({ ok: false, error: "Not signed in." }, { status: 401 });
  const input = schema.safeParse(await req.json().catch(() => null));
  if (!input.success) return Response.json({ ok: false, error: "Invalid request." }, { status: 400 });
  const result = await reviewTshirtOrder(input.data.orderId, input.data.action, session.email, input.data.note);
  return Response.json(result, { status: result.ok ? 200 : 400 });
}
