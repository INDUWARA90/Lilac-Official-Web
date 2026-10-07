"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function TshirtNavigationToggle({ initialVisible }: { initialVisible: boolean }) {
  const router = useRouter();
  const [visible, setVisible] = useState(initialVisible);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function changeVisibility(nextVisible: boolean) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/tshirts/settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tshirtLinkVisible: nextVisible }),
      });
      const result = await response.json() as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) {
        setError(result.error ?? "Could not update T-shirt navigation.");
        return;
      }
      setVisible(nextVisible);
      router.refresh();
    } catch {
      setError("We couldn't reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-card border border-hairline p-4">
      <label className="flex items-start gap-3 font-sans text-sm text-ink">
        <input
          type="checkbox"
          checked={visible}
          disabled={busy}
          onChange={(event) => void changeVisibility(event.target.checked)}
          className="mt-1 accent-accent"
        />
        <span>
          <strong className="block">Show T-shirt link on the public site</strong>
          <span className="mt-1 block text-xs text-ink-muted">
            Controls the T-shirts navigation link and home-page order button. Hiding the link does not close orders or disable direct access.
          </span>
        </span>
      </label>
      <p aria-live="polite" className="mt-2 min-h-5 font-sans text-xs text-ink-muted">
        {busy ? "Saving…" : error ?? (visible ? "T-shirt link is enabled." : "T-shirt link is hidden.")}
      </p>
    </div>
  );
}
