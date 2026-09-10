"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

/** Door-staff unlock: enter the shared access code once per device. */
export function CheckinUnlock() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        router.refresh();
      } else {
        setError(data.error ?? "Could not unlock.");
      }
    } catch {
      setError("We couldn't reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 font-sans text-sm font-medium text-ink-muted">
        Access code
        <input
          type="password"
          autoComplete="one-time-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="rounded-field border border-hairline bg-transparent px-3 py-2 text-base text-ink focus:border-accent focus:outline-none"
        />
      </label>
      {error && <p className="font-sans text-sm text-red-600">{error}</p>}
      <Button type="submit" loading={busy} className="self-start">
        Unlock this device
      </Button>
    </form>
  );
}
