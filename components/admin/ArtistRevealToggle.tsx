"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ArtistRevealToggle({ initialVisible }: { initialVisible: boolean }) {
  const router = useRouter();
  const [visible, setVisible] = useState(initialVisible);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleVisibility() {
    const nextVisible = !visible;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/artists/visibility", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ visible: nextVisible }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) {
        setError(result.error ?? "Could not update artist photo visibility.");
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
    <div className="mt-3 rounded-card border border-hairline p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-sans text-sm text-ink">
          {visible ? "Real artist photos and names are revealed." : "Silhouette photos and unknown names are shown."}
        </p>
        <button
          type="button"
          onClick={() => void toggleVisibility()}
          disabled={busy}
          className="rounded-field border border-accent bg-accent px-4 py-2 font-sans text-sm font-semibold text-white transition-colors hover:bg-accent-strong disabled:opacity-50"
        >
          {busy ? "Saving…" : visible ? "Hide artist reveal" : "Reveal artists"}
        </button>
      </div>
      <p aria-live="polite" className="mt-2 min-h-5 font-sans text-xs text-ink-muted">
        {error ?? "Switch between silhouette photos with unknown labels and the real artist photos and names."}
      </p>
    </div>
  );
}
