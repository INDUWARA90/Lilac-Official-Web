"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

/** Re-sends one winner's email — shown next to "failed" or "pending" rows on /admin/winners. */
export function ResendButton({ winnerId }: { winnerId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function resend() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/winners/resend", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ winnerId }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        router.refresh();
      } else {
        setError(data.error ?? "Could not resend.");
      }
    } catch {
      setError("We couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <Button
        variant="ghost"
        loading={busy}
        onClick={resend}
        className="!px-3 !py-1 text-xs"
      >
        Resend
      </Button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  );
}
