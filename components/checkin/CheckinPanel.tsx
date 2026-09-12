"use client";

import { useState } from "react";
import { formatTime } from "@/lib/format";

type Outcome = "checked_in" | "refused" | null;

/** Big Check in / Refuse buttons on the scan-result screen. */
export function CheckinPanel({ token }: { token: string }) {
  const [busy, setBusy] = useState<"checkin" | "refuse" | null>(null);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(action: "checkin" | "refuse") {
    setBusy(action);
    setError(null);
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
      setBusy(null);
    }
  }

  if (outcome === "checked_in") {
    return (
      <div className="mt-6 rounded-card bg-green-100 px-4 py-6 font-sans text-lg font-semibold text-green-800">
        Checked in ✓
      </div>
    );
  }
  if (outcome === "refused") {
    return (
      <div className="mt-6 rounded-card bg-red-100 px-4 py-6 font-sans text-lg font-semibold text-red-800">
        Entry refused
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-3">
      {error && (
        <p className="rounded-field bg-red-50 px-3 py-2 font-sans text-sm text-red-700">{error}</p>
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
