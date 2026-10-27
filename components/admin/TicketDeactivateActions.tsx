"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

/** Deactivates every issued ticket belonging to one buyer's purchase. */
export function TicketDeactivateActions({ purchaseId }: { purchaseId: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailWarning, setEmailWarning] = useState(false);

  async function deactivate() {
    if (!window.confirm("Withdraw these QR tickets and return this purchase to pending review? The old QR tickets will stop working.")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "deactivate", purchaseId, note }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string; emailSent?: boolean };
      if (data.ok) {
        if (data.emailSent === false) setEmailWarning(true);
        else router.refresh();
      }
      else setError(data.error ?? "Could not deactivate the purchase.");
    } catch {
      setError("We couldn't reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (emailWarning) {
    return (
      <div className="rounded-card border border-amber-300 bg-amber-50 p-4">
        <h2 className="text-lg text-ink">Tickets deactivated — email did not send</h2>
        <p className="mt-1 font-sans text-sm text-ink-muted">
          The old QR tickets were removed and the order is pending review, but the buyer was not notified by email. Check the mail-backend connection before approving replacement tickets.
        </p>
        <button type="button" onClick={() => router.refresh()} className="mt-4 rounded-field border border-hairline px-3 py-1.5 font-sans text-sm text-accent-strong hover:border-accent">
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-red-200 bg-red-50/50 p-4">
      <h2 className="text-lg text-ink">Withdraw tickets and return to review</h2>
      <p className="mt-1 font-sans text-sm text-ink-muted">
        This removes every issued QR ticket, changes the order back to pending review, and clears the prior email delivery so approving it again generates and emails fresh QR tickets.
      </p>
      <label className="mt-4 flex flex-col gap-1.5 font-sans text-sm font-medium text-ink-muted">
        Reason for the buyer (optional)
        <input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={500}
          placeholder="e.g. Replaced after a payment correction."
          className="rounded-field border border-hairline bg-white px-3 py-1.5 text-sm text-ink focus:border-red-400 focus:outline-none"
        />
      </label>
      {error && <p className="mt-3 font-sans text-sm text-red-700">{error}</p>}
      <Button className="mt-4" variant="ghost" onClick={deactivate} loading={busy}>
        Return tickets to review
      </Button>
    </div>
  );
}
