"use client";

import { useEffect, useState } from "react";

export function TshirtBackupButton() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);

  useEffect(() => {
    if (!busy) return;
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [busy]);

  async function downloadBackup() {
    setBusy(true);
    setElapsedSeconds(0);
    setDownloadProgress(null);
    setMessage("Preparing your T-shirt orders and receipts...");
    setError(null);

    try {
      const response = await fetch("/api/admin/export/tshirts-backup");
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error ?? "Could not prepare the T-shirt backup.");
      }

      const contentLength = Number(response.headers.get("content-length"));
      const blob = await downloadBlob(response, (received) => {
        if (Number.isFinite(contentLength) && contentLength > 0) {
          setDownloadProgress(Math.min(100, Math.round((received / contentLength) * 100)));
        }
      });
      if (blob.type !== "application/zip") {
        throw new Error("The server returned an invalid backup file. Please try again.");
      }

      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const disposition = response.headers.get("content-disposition");
      const filename = disposition?.match(/filename="([^"]+)"/)?.[1];
      link.href = objectUrl;
      link.download = filename ?? "lailac-tshirt-orders-backup.zip";
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
          : "Could not download the T-shirt backup. Please try again.",
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
        {busy ? "Preparing backup..." : "Backup orders + receipts (ZIP)"}
      </button>
      {message && (
        <p role="status" aria-live="polite" className="font-sans text-xs text-ink-muted">
          {message}
        </p>
      )}
      {busy && (
        <div className="w-full max-w-64" aria-live="polite">
          <div className="h-1.5 overflow-hidden rounded-full bg-accent-wash" aria-hidden="true">
            <div
              className={"h-full rounded-full bg-accent " + (downloadProgress === null ? "w-2/3 animate-pulse" : "transition-[width]")}
              style={downloadProgress === null ? undefined : { width: `${downloadProgress}%` }}
            />
          </div>
          <p className="mt-1 font-sans text-xs text-ink-muted">
            {downloadProgress === null
              ? `Preparing backup (${formatElapsed(elapsedSeconds)})`
              : `Downloading backup (${downloadProgress}%)`}
          </p>
        </div>
      )}
      {error && (
        <p role="alert" className="font-sans text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

function formatElapsed(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

async function downloadBlob(response: Response, onChunk: (received: number) => void): Promise<Blob> {
  if (!response.body) return response.blob();

  const reader = response.body.getReader();
  const chunks: ArrayBuffer[] = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer);
    received += value.byteLength;
    onChunk(received);
  }
  return new Blob(chunks, { type: response.headers.get("content-type") ?? "application/zip" });
}
