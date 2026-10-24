"use client";

import { useState } from "react";
import { Sparkle } from "@/components/ui/decor/Sparkle";
import { Button } from "@/components/ui/Button";
import { formatTime } from "@/lib/format";
import type { TicketPurchaseStatus } from "@/lib/tickets-shared";

type TicketPassCardProps = {
  ticket: { seat_label: string; holder_name: string; checked_in_at: string | null };
  purchaseReference: string;
  purchaseName: string;
  purchaseRegistrationNumber: string;
  purchaseFaculty: string;
  purchaseStatus: TicketPurchaseStatus;
  qr: string | null;
};

export function TicketPassCard({
  ticket,
  purchaseReference,
  purchaseName,
  purchaseRegistrationNumber,
  purchaseFaculty,
  purchaseStatus,
  qr,
}: TicketPassCardProps) {
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
      ctx.fillStyle = "#f8f5fc";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Main Outer Card Shadow & Rounded Frame
      const margin = 50;
      const cardWidth = canvas.width - margin * 2;
      const cardHeight = canvas.height - margin * 2;
      const radius = 36;

      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(110, 80, 160, 0.16)";
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 15;

      ctx.beginPath();
      ctx.roundRect(margin, margin, cardWidth, cardHeight, radius);
      ctx.fill();
      ctx.restore();

      // Outer Decorative Border
      ctx.strokeStyle = "#e2d9ec";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(margin, margin, cardWidth, cardHeight, radius);
      ctx.stroke();

      // 3. Top Gradient Header Section
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(margin, margin, cardWidth, 400, [radius, radius, 0, 0]);
      ctx.clip();

      const gradient = ctx.createLinearGradient(margin, margin, cardWidth, 450);
      gradient.addColorStop(0, "#7b539f");
      gradient.addColorStop(0.6, "#9467c8");
      gradient.addColorStop(1, "#cbb0e9");
      ctx.fillStyle = gradient;
      ctx.fillRect(margin, margin, cardWidth, 400);

      // Ambient decorative circle in header
      ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
      ctx.beginPath();
      ctx.arc(canvas.width - 100, 100, 220, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 4. Header Typography
      ctx.textAlign = "center";

      ctx.fillStyle = "#f3d98a";
      ctx.font = "bold 28px Arial, sans-serif";
      ctx.fillText("❀   LILAC LIVE IN CONCERT   ❀", canvas.width / 2, 130);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 66px Georgia, serif";
      ctx.fillText(ticket.seat_label, canvas.width / 2, 230);

      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.font = "bold 32px Arial, sans-serif";
      ctx.fillText(`Holder: ${ticket.holder_name}`, canvas.width / 2, 305);

      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.font = "bold 24px monospace";
      ctx.fillText(`REF: ${purchaseReference}`, canvas.width / 2, 355);

      // 5. Perforated Divider Line
      const notchY = 480;
      ctx.strokeStyle = "#e8e1ef";
      ctx.lineWidth = 3;
      ctx.setLineDash([14, 14]);
      ctx.beginPath();
      ctx.moveTo(margin + 40, notchY);
      ctx.lineTo(canvas.width - margin - 40, notchY);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash

      // 6. QR Code Card Container
      const qrSize = 580;
      const qrX = (canvas.width - qrSize) / 2;
      const qrY = 560;

      // QR Shadow Card Frame
      ctx.save();
      ctx.shadowColor = "rgba(123, 83, 159, 0.12)";
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 10;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(qrX - 28, qrY - 28, qrSize + 56, qrSize + 56, 28);
      ctx.fill();
      ctx.strokeStyle = "#f0ebf5";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Render QR Code
      ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

      // 7. Event & Attendee Details
      const metaY = 1270;

      ctx.fillStyle = "#2e2437";
      ctx.font = "bold 34px Arial, sans-serif";
      ctx.fillText(purchaseName, canvas.width / 2, metaY);

      ctx.fillStyle = "#7b539f";
      ctx.font = "semibold 28px Arial, sans-serif";
      ctx.fillText(purchaseFaculty || "Faculty of Technology", canvas.width / 2, metaY + 45);

      ctx.fillStyle = "#5d3a85";
      ctx.font = "bold 26px monospace";
      ctx.fillText(`REG NO: ${purchaseRegistrationNumber || "Not provided"}`, canvas.width / 2, metaY + 90);
      ctx.font = "bold 32px monospace";
      ctx.fillText(`ENTRY REF: ${purchaseReference}`, canvas.width / 2, metaY + 140);

      // 8. Footer Instructions & Legal Note
      ctx.fillStyle = "#8a7b96";
      ctx.font = "24px Arial, sans-serif";
      ctx.fillText("Please present this QR code clearly at the entrance gate.", canvas.width / 2, metaY + 205);
      ctx.fillText("Valid for single admission. Non-transferable.", canvas.width / 2, metaY + 245);

      // 9. Download Trigger
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
    <div className="lailac-magic-card lailac-float relative mx-auto max-w-md overflow-hidden border border-accent/25 px-6 py-10 shadow-md sm:px-8">
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-accent/15 blur-3xl" />
      <Sparkle size={18} gold className="absolute left-6 top-5" delay={0.4} />
      <Sparkle size={14} className="absolute right-6 top-6 opacity-80" delay={1.3} />
      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3.5 py-1 font-sans text-xs font-semibold uppercase tracking-wider text-accent-strong">
        <Sparkle size={12} gold />
        Lilac Event Pass
      </div>
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink">{ticket.seat_label}</h1>
      <div className="mt-1.5 flex flex-col items-center gap-1 font-sans text-sm text-ink-muted">
        <span className="font-medium text-ink">{purchaseName}</span>
        <span>{purchaseFaculty || "Faculty not provided"}</span>
        <span>Registration no: {purchaseRegistrationNumber || "Not provided"}</span>
        <span className="font-mono uppercase tracking-wider">{purchaseReference}</span>
      </div>
      {valid ? (
        <div className="mt-6 flex flex-col items-center">
          {qr && (
            <div className="rounded-card bg-white p-3 shadow-xs ring-1 ring-hairline">
              {/* eslint-disable-next-line @next/next/no-img-element -- inline QR data URL */}
              <img src={qr} alt="Ticket QR code" className="h-auto w-56 rounded-xs sm:w-60" />
            </div>
          )}
          {checkedIn ? (
            <div className="mx-auto mt-6 flex items-center gap-2 rounded-pill border border-green-300 bg-green-100/90 px-4 py-2 font-sans text-sm font-semibold text-green-800 shadow-2xs">
              <span className="size-2 animate-pulse rounded-full bg-green-600" />
              Checked in at {formatTime(ticket.checked_in_at as string)}
            </div>
          ) : (
            <div className="mt-6 w-full space-y-4">
              <p className="font-sans text-xs text-ink-muted sm:text-sm">
                Present this QR code clearly at the entrance gate for scanning.
              </p>
              <Button
                type="button"
                variant="magic"
                onClick={handleDownload}
                loading={downloading}
                disabled={!qr}
                className="w-full px-6 py-2.5 text-sm shadow-sm sm:w-auto"
              >
                Download Ticket QR
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="mx-auto mt-6 w-fit rounded-pill border border-red-300 bg-red-100/80 px-4 py-2 font-sans text-sm font-semibold text-red-800 shadow-2xs">
          Not valid — {purchaseStatus.replace("_", " ")}
        </div>
      )}
    </div>
  );
}
