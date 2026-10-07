import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { updateTshirtLinkVisible } from "@/lib/tshirts";

export const dynamic = "force-dynamic";

const schema = z.object({ tshirtLinkVisible: z.boolean() });

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return Response.json({ ok: false, error: "Not signed in." }, { status: 401 });
  if (session.role !== "admin") return Response.json({ ok: false, error: "Not authorised." }, { status: 403 });

  const input = schema.safeParse(await req.json().catch(() => null));
  if (!input.success) return Response.json({ ok: false, error: "Invalid request." }, { status: 400 });

  const ok = await updateTshirtLinkVisible(input.data.tshirtLinkVisible, session.email);
  return ok
    ? Response.json({ ok: true })
    : Response.json({ ok: false, error: "Could not update T-shirt navigation." }, { status: 500 });
}
