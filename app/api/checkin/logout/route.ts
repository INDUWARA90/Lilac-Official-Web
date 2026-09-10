import { cookies } from "next/headers";
import { publicEnv } from "@/lib/env";
import { CHECKIN_COOKIE } from "@/lib/checkin-auth";

/** POST /api/checkin/logout — lock this device (clear the check-in cookie). */
export const dynamic = "force-dynamic";

export async function POST() {
  (await cookies()).delete(CHECKIN_COOKIE);
  return Response.redirect(`${publicEnv.siteUrl}/checkin`, 303);
}
