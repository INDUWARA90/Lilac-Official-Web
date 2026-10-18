import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/http";
import { tshirtOrderSchema } from "@/lib/validation/tshirt";
import { createTshirtOrder, getTshirtSettings } from "@/lib/tshirts";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  if (!(await getTshirtSettings()).tshirtLinkVisible) {
    return Response.json({ ok: false, error: "T-shirt ordering is unavailable." }, { status: 404 });
  }
  if (!(await checkRateLimit(`tshirt-order:${getClientIp(req.headers)}`, 6, 10 * 60_000)).ok) return Response.json({ ok: false, error: "Too many attempts. Please wait a few minutes." }, { status: 429 });
  const parsed = tshirtOrderSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      if (key) (fieldErrors[key] ??= []).push(issue.message);
    }
    return Response.json({ ok: false, error: "Please correct the highlighted fields.", fieldErrors }, { status: 400 });
  }
  try {
    const result = await createTshirtOrder(parsed.data);
    return Response.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    console.error("T-shirt order creation failed unexpectedly.", error);
    return Response.json(
      { ok: false, error: "We couldn't save your order. Please try again shortly." },
      { status: 500 },
    );
  }
}
