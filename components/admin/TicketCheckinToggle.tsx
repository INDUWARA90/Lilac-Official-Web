"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Manual check-in / undo for a single ticket (admin side). */
export function TicketCheckinToggle({
  token,
  checkedIn,
}: {
  token: string;
  checkedIn: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    const action = checkedIn ? "undo_checkin" : "checkin";
    if (action === "undo_checkin" && !window.confirm("Revert this check-in?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, token }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) router.refresh();
      else setError(data.error ?? "Failed.");
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className="rounded-field border border-hairline px-2.5 py-1 font-sans text-xs font-medium text-accent-strong transition-colors hover:border-accent disabled:opacity-50"
      >
        {busy ? "…" : checkedIn ? "Undo check-in" : "Check in"}
      </button>
      {error && <span className="font-sans text-xs text-red-600">{error}</span>}
    </span>
  );
}
