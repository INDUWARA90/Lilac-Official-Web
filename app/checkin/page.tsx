import type { Metadata } from "next";
import { hasCheckinSession } from "@/lib/checkin-auth";
import { serverEnv } from "@/lib/env";
import { CheckinUnlock } from "@/components/checkin/CheckinUnlock";

export const metadata: Metadata = { title: "Door check-in", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CheckinHome() {
  const [unlocked, configured] = [
    await hasCheckinSession(),
    Boolean(serverEnv.checkinAccessCode),
  ];

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="text-2xl text-ink">Door check-in</h1>

      {!configured ? (
        <p className="mt-4 font-sans text-sm text-red-600">
          <code>CHECKIN_ACCESS_CODE</code> isn&rsquo;t set. Add it to the environment to enable
          scanning.
        </p>
      ) : unlocked ? (
        <div className="mt-4 font-sans text-sm text-ink-muted">
          <p>
            This device is ready. Point the camera at a ticket QR code — it opens the check-in
            screen for that person.
          </p>
          <form action="/api/checkin/logout" method="post" className="mt-6">
            <button
              type="submit"
              className="rounded-field border border-hairline px-3 py-1.5 text-xs font-medium text-ink-muted hover:border-accent hover:text-accent-strong"
            >
              Lock this device
            </button>
          </form>
        </div>
      ) : (
        <>
          <p className="mt-3 font-sans text-sm text-ink-muted">
            Enter the staff access code to use this device for check-in.
          </p>
          <CheckinUnlock />
        </>
      )}
    </div>
  );
}
