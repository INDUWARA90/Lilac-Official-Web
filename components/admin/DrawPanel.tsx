"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";

/**
 * Run-a-draw form. Confirms before firing (a draw can't be undone), then shows
 * the result summary.
 */
export function DrawPanel({ eligibleCount }: { eligibleCount: number }) {
  const router = useRouter();
  const [count, setCount] = useState("10");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ winners: number } | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const n = Number(count);
    if (!Number.isInteger(n) || n < 1) {
      setError("Enter a whole number of winners.");
      return;
    }
    if (!window.confirm(`Draw ${n} winner${n === 1 ? "" : "s"}? This cannot be undone.`)) {
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/admin/draw", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "run", winnerCount: n }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        winners?: number;
      };
      if (data.ok) {
        setResult({ winners: data.winners ?? 0 });
        router.refresh();
      } else {
        setError(data.error ?? "The draw could not be run.");
      }
    } catch {
      setError("We couldn't reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className="rounded-card border border-hairline p-5">
        <h2 className="text-lg text-ink">Draw complete</h2>
        <p className="mt-2 font-sans text-sm text-ink-muted">
          {result.winners} winner{result.winners === 1 ? "" : "s"} selected.
          Confirmation emails are sending in the background — track their status
          on the Winners page.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={run} className="max-w-xs rounded-card border border-hairline p-5">
      <p className="font-sans text-sm text-ink-muted">
        {eligibleCount} eligible entr{eligibleCount === 1 ? "y" : "ies"} (verified,
        not already a winner).
      </p>
      <div className="mt-4">
        <TextField
          label="Number of winners"
          inputMode="numeric"
          value={count}
          onChange={(e) => setCount(e.target.value.replace(/\D/g, ""))}
        />
      </div>
      {error && <p className="mt-3 font-sans text-sm text-red-600">{error}</p>}
      <Button type="submit" loading={busy} className="mt-4">
        Run draw
      </Button>
    </form>
  );
}
