"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Records a staff-sent ticket email so the automatic queue cannot duplicate it. */
export function MarkTicketEmailSentButton({ purchaseId }: { purchaseId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function markSent() {
    if (!window.confirm("Only continue after you have personally sent the ticket email. This stops automatic retries for this purchase.")) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/tickets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "mark_email_sent_manually", purchaseId }),
      });
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (!data.ok) setError(data.error ?? "Could not update the email status.");
      else router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="mt-1 block">
      <button
        type="button"
        onClick={markSent}
        disabled={busy}
        className="text-xs text-accent-strong hover:underline disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Saving…" : "Mark sent manually"}
      </button>
      {error && <span className="mt-1 block max-w-44 text-xs text-red-600">{error}</span>}
    </span>
  );
}
