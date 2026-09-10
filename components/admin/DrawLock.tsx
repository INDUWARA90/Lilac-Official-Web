"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

/**
 * Lock / unlock the winner draw. Locked by default — an admin unlocks it on the
 * event date. When locked, the Draw page hides its controls and the server
 * refuses to run a draw.
 */
export function DrawLock({
  unlocked,
  variant = "panel",
}: {
  unlocked: boolean;
  variant?: "panel" | "inline";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle(action: "unlock" | "lock") {
    if (
      action === "unlock" &&
      !window.confirm("Unlock the winner draw? Only do this on the event date.")
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/draw", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) router.refresh();
      else setError(data.error ?? "Could not update the lock.");
    } catch {
      setError("We couldn't reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (variant === "inline") {
    return (
      <span className="inline-flex items-center gap-2 font-sans text-sm">
        <span className={unlocked ? "text-ink" : "text-ink-muted"}>
          Winner draw: <strong>{unlocked ? "unlocked" : "locked"}</strong>
        </span>
        <button
          type="button"
          onClick={() => toggle(unlocked ? "lock" : "unlock")}
          disabled={busy}
          className="rounded-field border border-hairline px-2.5 py-1 text-xs font-medium text-accent-strong transition-colors hover:border-accent disabled:opacity-50"
        >
          {busy ? "…" : unlocked ? "Lock" : "Unlock"}
        </button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </span>
    );
  }

  return (
    <div className="max-w-md rounded-card border border-hairline p-5">
      <h2 className="text-lg text-ink">
        {unlocked ? "The draw is unlocked" : "The draw is locked"}
      </h2>
      <p className="mt-2 font-sans text-sm text-ink-muted">
        {unlocked
          ? "Winners can be drawn now. Lock it again once the event draw is done."
          : "Winners can only be drawn once you unlock this — do it on the event date."}
      </p>
      {error && <p className="mt-3 font-sans text-sm text-red-600">{error}</p>}
      <Button
        onClick={() => toggle(unlocked ? "lock" : "unlock")}
        loading={busy}
        className="mt-4"
      >
        {unlocked ? "Lock the draw" : "Unlock the draw"}
      </Button>
    </div>
  );
}
