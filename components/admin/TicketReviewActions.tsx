"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

/**
 * Review a pending purchase: check the slip, tick the confirmation box, then
 * "Confirm order" — which issues the tickets and emails the QR + reference
 * via Mailjet. The buyer can also always look their ticket(s) up themselves
 * at /tickets/status (reference + phone/email) — handy as a backup if the
 * email doesn't land, and it's still the only place a rejection note shows.
 */
export function TicketReviewActions({ purchaseId }: { purchaseId: string }) {
  const router = useRouter();
  const [slipChecked, setSlipChecked] = useState(false);
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Distinct from `error`: the order still succeeded, so we hold off on
  // router.refresh() (which would unmount this component — see the parent
  // page's `purchase.status === "pending_review"` guard) until the admin has
  // seen it and clicked through.
  const [emailWarning, setEmailWarning] = useState(false);

  async function act(action: "approve" | "reject") {
    if (action === "approve" && !slipChecked) return;
    setBusy(action);
    setError(null);
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          action === "reject" ? { action, purchaseId, note } : { action, purchaseId },
        ),
      });
      const data = (await res.json()) as { ok: boolean; error?: string; emailSent?: boolean };
      if (data.ok) {
        if (action === "approve" && data.emailSent === false) {
          setEmailWarning(true);
        } else {
          router.refresh();
        }
      } else {
        setError(data.error ?? "Something went wrong.");
      }
    } catch {
      setError("We couldn't reach the server. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  if (emailWarning) {
    return (
      <div className="rounded-card border border-amber-300 bg-amber-50 p-4">
        <h2 className="text-lg text-ink">Order confirmed — email didn&rsquo;t send</h2>
        <p className="mt-1 font-sans text-sm text-ink-muted">
          Tickets were issued, but the e-ticket email did not send (check{" "}
          <code className="text-xs">MAILJET_*</code> env vars, or see{" "}
          <a href="/admin/audit" className="text-accent-strong underline">
            /admin/audit
          </a>{" "}
          for the reason). The buyer can still get their ticket at{" "}
          <a href="/tickets/status" className="text-accent-strong underline">
            /tickets/status
          </a>
          , or you can copy the link(s) below and send them manually.
        </p>
        <Button className="mt-4" variant="ghost" onClick={() => router.refresh()}>
          Continue
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-hairline p-4">
      <h2 className="text-lg text-ink">Review payment</h2>
      <p className="mt-1 font-sans text-sm text-ink-muted">
        Open the slip above and match it against your bank account — amount, date and
        reference.
      </p>

      <label className="mt-4 flex items-start gap-2 font-sans text-sm text-ink">
        <input
          type="checkbox"
          checked={slipChecked}
          onChange={(e) => setSlipChecked(e.target.checked)}
          className="mt-0.5 accent-accent"
        />
        I have checked this slip against our bank account and the payment has been received.
      </label>

      <label className="mt-4 flex flex-col gap-1.5 font-sans text-sm font-medium text-ink-muted">
        Note to buyer (shown on their ticket status check if you reject)
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. We couldn't find this transfer."
          className="rounded-field border border-hairline bg-transparent px-3 py-1.5 text-sm text-ink focus:border-accent focus:outline-none"
        />
      </label>

      {error && <p className="mt-3 font-sans text-sm text-red-600">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          onClick={() => act("approve")}
          loading={busy === "approve"}
          disabled={!slipChecked || busy !== null}
        >
          Confirm order &amp; email tickets
        </Button>
        <Button variant="ghost" onClick={() => act("reject")} loading={busy === "reject"}>
          Reject
        </Button>
      </div>
      {!slipChecked && (
        <p className="mt-2 font-sans text-xs text-ink-muted">
          Tick the box above to enable &ldquo;Confirm order&rdquo;.
        </p>
      )}
    </div>
  );
}
