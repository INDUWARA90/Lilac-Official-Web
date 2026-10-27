"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

/** Brings a legacy cancelled purchase back to the normal pending-review flow. */
export function TicketRestoreToReview({ purchaseId }: { purchaseId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function restore() {
    if (!window.confirm("Return this deactivated order to pending review? Its old QR tickets remain invalid and fresh tickets will be created only after approval.")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "restore_cancelled_to_review", purchaseId }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) router.refresh();
      else setError(data.error ?? "Could not return this order to review.");
    } catch {
      setError("We couldn't reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="rounded-card border border-amber-300 bg-amber-50 p-4">
    <h2 className="text-lg text-ink">Return deactivated order to review</h2>
    <p className="mt-1 font-sans text-sm text-ink-muted">This sets the order to pending review. Approving it afterwards generates and emails a fresh QR ticket set.</p>
    {error && <p className="mt-3 font-sans text-sm text-red-700">{error}</p>}
    <Button className="mt-4" variant="ghost" onClick={restore} loading={busy}>Return to pending review</Button>
  </div>;
}
