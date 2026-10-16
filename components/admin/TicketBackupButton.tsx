"use client";

import { useState } from "react";

export function TicketBackupButton() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function downloadBackup() {
    setBusy(true);
    setMessage("Preparing ticket purchases and slips...");
    setError(null);

    try {
      const response = await fetch("/api/admin/export/tickets-backup");
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error ?? "Could not prepare the ticket backup.");
      }

      const blob = await response.blob();
      if (blob.type !== "application/zip") {
        throw new Error("The server returned an invalid backup file. Please try again.");
      }

      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const disposition = response.headers.get("content-disposition");
      const filename = disposition?.match(/filename="([^"]+)"/)?.[1];
      link.href = objectUrl;
      link.download = filename ?? "lailac-ticket-purchases-backup.zip";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      setMessage("Backup download started. Check your browser's downloads.");
    } catch (cause) {
      setMessage(null);
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not download the ticket backup. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={downloadBackup}
        disabled={busy}
        className="rounded-field border border-hairline px-3 py-1.5 font-sans text-sm text-accent-strong hover:border-accent disabled:cursor-wait disabled:opacity-60"
      >
        {busy ? "Preparing backup..." : "Backup purchases + slips (ZIP)"}
      </button>
      {message && (
        <p role="status" aria-live="polite" className="font-sans text-xs text-ink-muted">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="font-sans text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
