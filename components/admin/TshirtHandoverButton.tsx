"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function TshirtHandoverButton({ orderId, handedOver = false, round = "new" }: { orderId: string; handedOver?: boolean; round?: "new" | "previous" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function toggle() {
    setBusy(true); setError(null);
    try {
      const response = await fetch("/api/admin/tshirts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: handedOver ? "undo_handover" : "handover", orderId, round }) });
      const data = await response.json() as { ok: boolean; error?: string };
      if (data.ok) router.refresh(); else setError(data.error ?? "Could not record handover.");
    } catch { setError("We couldn't reach the server."); }
    finally { setBusy(false); }
  }
  return <div className="mt-4"><Button onClick={toggle} loading={busy} variant={handedOver ? "ghost" : "magic"}>{handedOver ? "Mark as not given" : "Mark as given"}</Button>{error && <p className="mt-2 font-sans text-xs text-red-600">{error}</p>}</div>;
}
