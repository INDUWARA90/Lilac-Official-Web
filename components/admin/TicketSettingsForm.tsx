"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import type { TicketSettings } from "@/lib/tickets-shared";

export function TicketSettingsForm({ current }: { current: TicketSettings }) {
  const router = useRouter();
  const [v, setV] = useState({
    priceLkr: String(current.priceLkr),
    capacity: String(current.capacity),
    salesOpen: current.salesOpen,
    bankName: current.bankName,
    bankAccountName: current.bankAccountName,
    bankAccountNumber: current.bankAccountNumber,
    bankBranch: current.bankBranch,
    bankInstructions: current.bankInstructions,
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof v>(key: K, value: (typeof v)[K]) {
    setV((s) => ({ ...s, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "update_settings",
          priceLkr: Number(v.priceLkr) || 0,
          capacity: Number(v.capacity) || 0,
          salesOpen: v.salesOpen,
          bankName: v.bankName,
          bankAccountName: v.bankAccountName,
          bankAccountNumber: v.bankAccountNumber,
          bankBranch: v.bankBranch,
          bankInstructions: v.bankInstructions,
        }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        setMsg("Saved.");
        router.refresh();
      } else {
        setError(data.error ?? "Could not save.");
      }
    } catch {
      setError("We couldn't reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-lg flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-5">
        <TextField
          label="Price per ticket (LKR)"
          inputMode="numeric"
          value={v.priceLkr}
          onChange={(e) => set("priceLkr", e.target.value.replace(/\D/g, ""))}
        />
        <TextField
          label="Total capacity"
          inputMode="numeric"
          value={v.capacity}
          onChange={(e) => set("capacity", e.target.value.replace(/\D/g, ""))}
        />
      </div>

      <label className="flex items-center gap-2 font-sans text-sm text-ink">
        <input
          type="checkbox"
          checked={v.salesOpen}
          onChange={(e) => set("salesOpen", e.target.checked)}
          className="accent-accent"
        />
        Sales open
      </label>

      <hr className="border-hairline" />
      <p className="font-sans text-xs font-semibold uppercase tracking-wider text-ink-muted">
        Bank details (shown to buyers)
      </p>

      <TextField label="Bank name" value={v.bankName} onChange={(e) => set("bankName", e.target.value)} />
      <TextField
        label="Account name"
        value={v.bankAccountName}
        onChange={(e) => set("bankAccountName", e.target.value)}
      />
      <TextField
        label="Account number"
        value={v.bankAccountNumber}
        onChange={(e) => set("bankAccountNumber", e.target.value)}
      />
      <TextField label="Branch" value={v.bankBranch} onChange={(e) => set("bankBranch", e.target.value)} />
      <label className="flex flex-col gap-1.5 font-sans text-sm font-medium text-ink-muted">
        Extra instructions
        <textarea
          rows={3}
          value={v.bankInstructions}
          onChange={(e) => set("bankInstructions", e.target.value)}
          className="resize-y rounded-field border border-hairline bg-transparent px-3 py-2 font-sans text-sm text-ink focus:border-accent focus:outline-none"
        />
      </label>

      {error && <p className="font-sans text-sm text-red-600">{error}</p>}
      {msg && <p className="font-sans text-sm text-ink">{msg}</p>}

      <Button type="submit" loading={busy} className="self-start">
        Save settings
      </Button>
    </form>
  );
}
