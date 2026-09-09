"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

/**
 * Manual kick for the winner-email background job — a safety net if the
 * self-chaining processor ever stalls. Shown only when emails are pending.
 */
export function SendPendingButton({ pending }: { pending: number }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy" | "started">("idle");

  async function send() {
    setState("busy");
    try {
      await fetch("/api/admin/winners/process", { method: "POST" });
      setState("started");
      // Give the first batch a moment, then refresh the table.
      setTimeout(() => router.refresh(), 4000);
    } catch {
      setState("idle");
    }
  }

  return (
    <div className="mt-4 flex items-center gap-3 rounded-card border border-hairline bg-canvas-raised px-4 py-3">
      <p className="font-sans text-sm text-ink">
        {pending} confirmation email{pending === 1 ? "" : "s"} pending.
      </p>
      <Button onClick={send} loading={state === "busy"} className="px-4 py-2 text-xs">
        {state === "started" ? "Sending…" : "Send pending now"}
      </Button>
    </div>
  );
}
