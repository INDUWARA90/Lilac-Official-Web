import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { setArtistRevealVisible } from "@/lib/app-config";

export const dynamic = "force-dynamic";

const schema = z.object({ visible: z.boolean() });
const json = (body: unknown, status = 200) => Response.json(body, { status });

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return json({ ok: false, error: "Not signed in." }, 401);
  if (session.role !== "admin") return json({ ok: false, error: "Not authorised." }, 403);

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ ok: false, error: "Invalid request." }, 400);

  const { visible } = parsed.data;
  const saved = await setArtistRevealVisible(visible, session.email);
  if (!saved) {
    return json({ ok: false, error: "Could not update the artist reveal. Please try again." }, 500);
  }
  return json({ ok: true, visible });
}
