"use client";

import { useRef, useState } from "react";
import { formatTime } from "@/lib/format";

type Outcome = "checked_in" | "refused" | null;

/** Big Check in / Refuse buttons on the scan-result screen. */
export function CheckinPanel({ token }: { token: string }) {
  const [busy, setBusy] = useState<"checkin" | "refuse" | null>(null);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [error, setError] = useState<string | null>(null);
  const [slowConnection, setSlowConnection] = useState(false);
  const slowConnectionTimer = useRef<number | undefined>(undefined);

  async function act(action: "checkin" | "refuse") {
    setBusy(action);
    setError(null);
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
        setOutcome(action === "checkin" ? "checked_in" : "refused");
      } else {
        setError(
          data.alreadyAt
            ? `Already checked in at ${formatTime(data.alreadyAt)}.`
            : (data.error ?? "Something went wrong."),
        );
      }
    } catch {
      setError("Network error — try again.");
    } finally {
      if (slowConnectionTimer.current) {
        window.clearTimeout(slowConnectionTimer.current);
        slowConnectionTimer.current = undefined;
      }
      setBusy(null);
    }
  }

  if (outcome) {
    const ok = outcome === "checked_in";
    return (
      <div
        role="status"
        className={
          "mt-6 flex flex-col items-center gap-3 rounded-card px-4 py-7 font-sans text-lg font-semibold " +
          (ok ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")
        }
      >
        <span aria-hidden className="text-5xl leading-none">{ok ? "✓" : "×"}</span>
        {ok ? "Checked in" : "Entry refused"}
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-3">
      {error && (
        <p key={error} className="lailac-error-in rounded-field bg-red-50 px-3 py-2 font-sans text-sm text-red-700">
          {error}
        </p>
      )}
      {slowConnection && (
        <p role="status" className="rounded-field bg-amber-50 px-3 py-2 font-sans text-sm text-amber-800">
          Still checking the ticket. Keep this screen open and do not scan it again.
        </p>
      )}
      <button
        type="button"
        onClick={() => act("checkin")}
        disabled={busy !== null}
        className="rounded-card bg-green-600 px-4 py-4 font-sans text-lg font-semibold text-white transition-opacity disabled:opacity-50"
      >
        {busy === "checkin" ? "…" : "Check in"}
      </button>
      <button
        type="button"
        onClick={() => act("refuse")}
        disabled={busy !== null}
        className="rounded-card border border-red-300 px-4 py-3 font-sans text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
      >
        {busy === "refuse" ? "…" : "Refuse entry"}
      </button>
    </div>
  );
}

/** A circle that draws itself, then a cross — the "refused" counterpart to AnimatedCheck. */
