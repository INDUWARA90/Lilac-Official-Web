import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "@/lib/auth";
import { publicEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

/** POST /api/admin/logout — clear the admin session cookie. */
export async function POST() {
  (await cookies()).delete(ADMIN_COOKIE);
  return Response.redirect(`${publicEnv.siteUrl}/admin/login`, 303);
}
