"use client";

import { useRef, useState } from "react";

type Action = "checkin" | "checkout";

/** Door controls that always reflect the ticket's last confirmed state. */
export function CheckinPanel({
  token,
  initiallyCheckedIn,
}: {
  token: string;
  initiallyCheckedIn: boolean;
}) {
  const [checkedIn, setCheckedIn] = useState(initiallyCheckedIn);
  const [busy, setBusy] = useState<Action | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [slowConnection, setSlowConnection] = useState(false);
  const slowConnectionTimer = useRef<number | undefined>(undefined);

  async function update(action: Action) {
    setBusy(action);
    setError(null);
    setMessage(null);
    setSlowConnection(false);
    slowConnectionTimer.current = window.setTimeout(() => setSlowConnection(true), 3_000);

    try {
      const res = await fetch(`/api/checkin/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string; alreadyAt?: string };
      if (data.ok) {
        const nowCheckedIn = action === "checkin";
        setCheckedIn(nowCheckedIn);
        setMessage(nowCheckedIn ? "Checked in" : "Checked out");
      } else {
        if (data.alreadyAt) setCheckedIn(true);
        setError(data.error ?? "Could not update this ticket.");
      }
    } catch {
      setError("Network error. Check the connection and try again.");
    } finally {
      if (slowConnectionTimer.current) {
        window.clearTimeout(slowConnectionTimer.current);
        slowConnectionTimer.current = undefined;
      }
      setBusy(null);
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-3">
      <p
        className={
          "rounded-field px-3 py-2 font-sans text-sm " +
          (checkedIn ? "bg-amber-100 text-amber-800" : "bg-canvas-raised text-ink-muted")
        }
      >
        {checkedIn ? "Currently checked in" : "Not checked in"}
      </p>
      {message && <p role="status" className="rounded-field bg-green-100 px-3 py-2 font-sans text-sm text-green-800">{message}</p>}
      {error && <p role="alert" className="rounded-field bg-red-50 px-3 py-2 font-sans text-sm text-red-700">{error}</p>}
      {slowConnection && (
        <p role="status" className="rounded-field bg-amber-50 px-3 py-2 font-sans text-sm text-amber-800">
          Still updating the ticket. Keep this screen open and do not scan it again.
        </p>
      )}
      <button
        type="button"
        onClick={() => update("checkin")}
        disabled={checkedIn || busy !== null}
        className="rounded-card bg-green-600 px-4 py-4 font-sans text-lg font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy === "checkin" ? "Checking in..." : "Check in"}
      </button>
      <button
        type="button"
        onClick={() => update("checkout")}
        disabled={!checkedIn || busy !== null}
        className="rounded-card border border-amber-400 px-4 py-3 font-sans text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy === "checkout" ? "Checking out..." : "Check out"}
      </button>
    </div>
  );
}
