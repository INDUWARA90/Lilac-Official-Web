"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function TicketReviewActions({ purchaseId }: { purchaseId: string }) {
  const router = useRouter();
  const [slipChecked, setSlipChecked] = useState(false);
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [emailWarning, setEmailWarning] = useState(false);

  async function act(action: "approve" | "reject") {
    if (action === "approve" && !slipChecked) return;
    setBusy(action);
    setError(null);
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(action === "reject" ? { action, purchaseId, note } : { action, purchaseId }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string; emailSent?: boolean };
      if (data.ok) {
        if (action === "approve" && data.emailSent === false) setEmailWarning(true);
        else router.refresh();
      } else setError(data.error ?? "Something went wrong.");
    } catch {
      setError("We couldn't reach the server. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  if (emailWarning) return <div className="rounded-card border border-amber-300 bg-amber-50 p-4"><h2 className="text-lg text-ink">Order confirmed — email didn&apos;t send</h2><p className="mt-1 font-sans text-sm text-ink-muted">Tickets were issued, but the buyer can still get them at <a href="/tickets/status" className="text-accent-strong underline">/tickets/status</a>.</p><Button className="mt-4" variant="ghost" onClick={() => router.refresh()}>Continue</Button></div>;

  return <div className="rounded-card border border-hairline p-4">
    <h2 className="text-lg text-ink">Review payment</h2>
    <p className="mt-1 font-sans text-sm text-ink-muted">Open the slip above and match it against your bank account — amount, date and reference.</p>
    <label className="mt-4 flex items-start gap-2 font-sans text-sm text-ink"><input type="checkbox" checked={slipChecked} onChange={(event) => setSlipChecked(event.target.checked)} className="mt-0.5 accent-accent" />I have checked this slip against our bank account and the payment has been received.</label>
    <label className="mt-4 flex flex-col gap-1.5 font-sans text-sm font-medium text-ink-muted">Note to buyer (shown on their ticket status check if you reject)<input value={note} onChange={(event) => setNote(event.target.value)} placeholder="e.g. We couldn't find this transfer." className="rounded-field border border-hairline bg-transparent px-3 py-1.5 text-sm text-ink focus:border-accent focus:outline-none" /></label>
    {error && <p className="mt-3 font-sans text-sm text-red-600">{error}</p>}
    <div className="mt-4 flex flex-wrap gap-3"><Button onClick={() => act("approve")} loading={busy === "approve"} disabled={!slipChecked || busy !== null}>Confirm order &amp; email tickets</Button><Button variant="ghost" onClick={() => act("reject")} loading={busy === "reject"} disabled={busy !== null}>Reject</Button></div>
    {!slipChecked && <p className="mt-2 font-sans text-xs text-ink-muted">Tick the box above to enable “Confirm order”.</p>}
  </div>;
}
