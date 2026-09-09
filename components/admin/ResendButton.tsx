"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Small per-winner "resend confirmation email" button. */
export function ResendButton({ winnerId }: { winnerId: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy" | "sent" | "error">("idle");

  async function resend() {
    setState("busy");
    try {
      const res = await fetch("/api/admin/winners/resend", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ winnerId }),
      });
      const data = (await res.json()) as { ok: boolean };
      setState(data.ok ? "sent" : "error");
      if (data.ok) router.refresh();
    } catch {
      setState("error");
    }
  }

  return (
    <button
      type="button"
      onClick={resend}
      disabled={state === "busy"}
      className="rounded-field border border-hairline px-2.5 py-1 font-sans text-xs font-medium text-accent-strong transition-colors hover:border-accent disabled:opacity-50"
    >
      {state === "busy"
        ? "Sending…"
        : state === "sent"
          ? "Sent"
          : state === "error"
            ? "Failed — retry"
            : "Resend email"}
    </button>
  );
}
