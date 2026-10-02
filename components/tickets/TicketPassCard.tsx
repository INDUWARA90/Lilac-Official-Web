"use client";

import { useState } from "react";
import { Sparkle } from "@/components/ui/decor/Sparkle";
import { Button } from "@/components/ui/Button";
import { formatTime } from "@/lib/format";
import type { TicketPurchaseStatus } from "@/lib/tickets-shared";

type TicketPassCardProps = {
  ticket: { seat_label: string; holder_name: string; checked_in_at: string | null };
  purchaseReference: string;
  purchaseStatus: TicketPurchaseStatus;
  qr: string | null;
};

export function TicketPassCard({ ticket, purchaseReference, purchaseStatus, qr }: TicketPassCardProps) {
  const [downloading, setDownloading] = useState(false);
  const valid = purchaseStatus === "approved";
  const checkedIn = Boolean(ticket.checked_in_at);

  async function handleDownload() {
    if (!qr) return;
    setDownloading(true);
    try {
      const qrImage = new Image();
      qrImage.crossOrigin = "anonymous";
      qrImage.src = qr;
      await new Promise<void>((resolve, reject) => {
        qrImage.onload = () => resolve();
        qrImage.onerror = () => reject(new Error("Could not prepare the QR code."));
      });

      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 1800;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not create the ticket image.");

      // 1. Background Base
      ctx.fillStyle = "#fbf9fc";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Outer Decorative Border Frame
      ctx.strokeStyle = "#e2d9ec";
      ctx.lineWidth = 4;
      ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

      // 3. Top Gradient Header Band
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 420);
      gradient.addColorStop(0, "#7b539f");
      gradient.addColorStop(1, "#a881d0");
      ctx.fillStyle = gradient;
      ctx.fillRect(40, 40, canvas.width - 80, 380);

      // Decorative background glow circle in header
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.beginPath();
      ctx.arc(1020, 100, 220, 0, Math.PI * 2);
      ctx.fill();

      // 4. Header Typography
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "bold 36px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("LILAC EVENT PASS", canvas.width / 2, 120);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 64px Georgia, serif";
      ctx.fillText(ticket.seat_label, canvas.width / 2, 225);

      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.font = "28px Arial, sans-serif";
      ctx.fillText(`Holder: ${ticket.holder_name}`, canvas.width / 2, 290);

      // 5. White Content Card with Soft Drop Shadow
      ctx.shadowColor = "rgba(123, 83, 159, 0.12)";
      ctx.shadowBlur = 35;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 12;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(100, 460, canvas.width - 200, 1140);

      // Reset shadow for internal details
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // 6. Perforated Divider Line
      ctx.strokeStyle = "#e8e1ef";
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 12]);
      ctx.beginPath();
      ctx.moveTo(160, 620);
      ctx.lineTo(canvas.width - 160, 620);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash

      // 7. QR Code Box with Drop Shadow & Inner Border
      const qrSize = 560;
      const qrX = (canvas.width - qrSize) / 2;
      const qrY = 680;

      ctx.shadowColor = "rgba(0, 0, 0, 0.08)";
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 6;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(qrX - 24, qrY - 24, qrSize + 48, qrSize + 48);
      ctx.strokeStyle = "#f0ebf5";
      ctx.lineWidth = 2;
      ctx.strokeRect(qrX - 24, qrY - 24, qrSize + 48, qrSize + 48);

      ctx.shadowColor = "transparent"; // Reset shadow
      ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

      // 8. Footer Instructions & Reference Code
      ctx.fillStyle = "#2e2437";
      ctx.font = "bold 32px Arial, sans-serif";
      ctx.fillText("Present this QR code at the entrance", canvas.width / 2, 1370);

      ctx.fillStyle = "#7b539f";
      ctx.font = "bold 34px monospace";
      ctx.fillText(purchaseReference, canvas.width / 2, 1440);

      ctx.fillStyle = "#8a7b96";
      ctx.font = "24px Arial, sans-serif";
      ctx.fillText("Keep this pass safe until entry. Non-transferable.", canvas.width / 2, 1525);

      // 9. Trigger download safely
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `Lilac-Event-Pass-${ticket.seat_label.replace(/\s+/g, "-")}-${purchaseReference}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Failed to generate ticket image:", err);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="lilac-magic-card lilac-float relative mx-auto max-w-md overflow-hidden border border-accent/25 px-6 py-10 shadow-md sm:px-8">
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-accent/15 blur-3xl" />
      <Sparkle size={18} gold className="absolute left-6 top-5" delay={0.4} />
      <Sparkle size={14} className="absolute right-6 top-6 opacity-80" delay={1.3} />
      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3.5 py-1 font-sans text-xs font-semibold uppercase tracking-wider text-accent-strong"><Sparkle size={12} gold />Lilac Event Pass</div>
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink">{ticket.seat_label}</h1>
      <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2 font-sans text-sm text-ink-muted"><span className="font-medium text-ink">{ticket.holder_name}</span><span>·</span><span className="font-mono uppercase tracking-wider">{purchaseReference}</span></div>
      {valid ? <div className="mt-6 flex flex-col items-center">{qr && <div className="rounded-card bg-white p-3 shadow-xs ring-1 ring-hairline">
        {/* eslint-disable-next-line @next/next/no-img-element -- inline QR data URL */}
        <img src={qr} alt="Ticket QR code" className="h-auto w-56 rounded-xs sm:w-60" />
      </div>}{checkedIn ? <div className="mx-auto mt-6 flex items-center gap-2 rounded-pill border border-green-300 bg-green-100/90 px-4 py-2 font-sans text-sm font-semibold text-green-800 shadow-2xs"><span className="size-2 animate-pulse rounded-full bg-green-600" />Checked in at {formatTime(ticket.checked_in_at as string)}</div> : <div className="mt-6 w-full space-y-4"><p className="font-sans text-xs text-ink-muted sm:text-sm">Present this QR code clearly at the entrance gate for scanning.</p><Button type="button" variant="magic" onClick={handleDownload} loading={downloading} disabled={!qr} className="w-full px-6 py-2.5 text-sm shadow-sm sm:w-auto">Download Ticket QR</Button></div>}</div> : <div className="mx-auto mt-6 w-fit rounded-pill border border-red-300 bg-red-100/80 px-4 py-2 font-sans text-sm font-semibold text-red-800 shadow-2xs">Not valid — {purchaseStatus.replace("_", " ")}</div>}
    </div>
  );
}
