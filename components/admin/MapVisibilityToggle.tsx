"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function MapVisibilityToggle({ initialVisible }: { initialVisible: boolean }) {
  const router = useRouter();
  const [visible, setVisible] = useState(initialVisible);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleVisibility(nextVisible: boolean) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/map/visibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visible: nextVisible }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) {
        setError(result.error ?? "Could not update map visibility.");
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
    <div className="rounded-card border border-hairline bg-canvas p-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={visible}
            disabled={busy}
            onChange={(e) => void toggleVisibility(e.target.checked)}
            className="mt-1 h-4 w-4 rounded accent-accent cursor-pointer"
          />
          <div>
            <strong className="block font-sans text-sm font-medium text-ink">
              Publish 3D event map on the public site
            </strong>
            <span className="mt-0.5 block font-sans text-xs text-ink-muted">
              Controls the &quot;Event map&quot; link in the navigation menu and public access to <code className="text-accent">/map</code>.
              When disabled, direct visits return a 404 and the navigation link is hidden.
            </span>
          </div>
        </label>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-xs font-medium ${
              visible
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-hairline bg-canvas-raised text-ink-muted"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                visible ? "bg-emerald-500" : "bg-ink-muted/50"
              }`}
            />
            {visible ? "Publicly visible" : "Hidden from public"}
          </span>
        </div>
      </div>

      <p aria-live="polite" className="mt-2 min-h-4 font-sans text-xs text-ink-muted">
        {busy ? "Saving changes…" : error ?? (visible ? "Map link is visible in site menu." : "Map is currently hidden from public visitors.")}
      </p>
    </div>
  );
}
