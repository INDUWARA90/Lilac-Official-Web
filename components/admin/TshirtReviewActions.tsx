"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
export function TshirtReviewActions({ orderId, isPartial = false }: { orderId: string; isPartial?: boolean }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"collect" | "collect_balance" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(action: "collect" | "collect_balance" | "reject") {
    if (action !== "reject" && !checked) return;
    setBusy(action);
    setError(null);
    try {
      const response = await fetch("/api/admin/tshirts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, orderId, note }),
      });
      const data = await response.json() as { ok: boolean; error?: string };
      if (data.ok) router.refresh();
      else setError(data.error ?? "Something went wrong.");
    } catch {
      setError("We couldn't reach the server.");
    } finally {
      setBusy(null);
    }
  }

  const action = isPartial ? "collect_balance" : "collect";
  return (
    <div className="rounded-card border border-hairline p-4">
      <h2 className="text-lg text-ink">{isPartial ? "Confirm remaining balance" : "Confirm manual collection"}</h2>
      <p className="mt-1 font-sans text-sm text-ink-muted">
        {isPartial
          ? "Verify that the outstanding balance has been received before marking the order fully paid."
          : "Check the receipt against the payment you received before confirming."}
      </p>
      <label className="mt-4 flex gap-2 font-sans text-sm text-ink">
        <input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} className="mt-0.5 accent-accent" />
        {isPartial ? "I have confirmed the remaining balance was collected." : "I have confirmed the payment was collected."}
      </label>
      <label className="mt-4 flex flex-col gap-1 font-sans text-sm text-ink-muted">
        Review note (optional)
        <input value={note} onChange={(event) => setNote(event.target.value)} className="rounded-field border border-hairline bg-transparent px-3 py-1.5 text-ink" />
      </label>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <div className="mt-4 flex gap-3">
        <Button onClick={() => act(action)} disabled={!checked || busy !== null} loading={busy === action}>
          {isPartial ? "Confirm balance received" : "Confirm payment received"}
        </Button>
        {!isPartial && (
          <Button variant="ghost" onClick={() => act("reject")} disabled={busy !== null} loading={busy === "reject"}>
            Reject
          </Button>
        )}
      </div>
    </div>
  );
}
