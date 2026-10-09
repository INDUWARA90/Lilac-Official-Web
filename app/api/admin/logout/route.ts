import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** POST /api/admin/logout — clear the admin session cookie. */
export async function POST(request: Request) {
  (await cookies()).delete(ADMIN_COOKIE);
  return Response.redirect(new URL("/admin/login", request.url), 303);
}
