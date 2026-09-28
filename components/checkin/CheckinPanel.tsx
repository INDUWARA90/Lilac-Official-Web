"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { AnimatedCheck } from "@/components/ui/decor/AnimatedCheck";
import { formatTime } from "@/lib/format";

type Outcome = "checked_in" | "refused" | null;

/** Big Check in / Refuse buttons on the scan-result screen. */
export function CheckinPanel({ token }: { token: string }) {
  const [busy, setBusy] = useState<"checkin" | "refuse" | null>(null);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [error, setError] = useState<string | null>(null);
  const reduce = useReducedMotion();

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

  if (outcome) {
    const ok = outcome === "checked_in";
    return (
      <motion.div
        role="status"
        initial={reduce ? false : { opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 20 }}
        className={
          "mt-6 flex flex-col items-center gap-3 rounded-card px-4 py-7 font-sans text-lg font-semibold " +
          (ok ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")
        }
      >
        {ok ? <AnimatedCheck size={56} className="text-green-700" /> : <RefusedMark />}
        {ok ? "Checked in" : "Entry refused"}
      </motion.div>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-3">
      {error && (
        <p key={error} className="lilac-error-in rounded-field bg-red-50 px-3 py-2 font-sans text-sm text-red-700">
          {error}
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
function RefusedMark() {
  const reduce = useReducedMotion();
  const draw = (delay: number, duration: number) =>
    reduce
      ? { initial: false as const }
      : {
          initial: { pathLength: 0, opacity: 0 },
          animate: { pathLength: 1, opacity: 1 },
          transition: { delay, duration, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <svg width={56} height={56} viewBox="0 0 56 56" fill="none" aria-hidden className="text-red-700">
      <motion.circle cx="28" cy="28" r="25" stroke="currentColor" strokeWidth="3" strokeLinecap="round" {...draw(0, 0.7)} />
      <motion.path d="M19 19l18 18" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" {...draw(0.55, 0.3)} />
      <motion.path d="M37 19L19 37" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" {...draw(0.75, 0.3)} />
    </svg>
  );
}
