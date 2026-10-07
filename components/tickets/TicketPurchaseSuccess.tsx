"use client";

import Link from "next/link";
import { AnimatedCheck } from "@/components/ui/decor/AnimatedCheck";
import { CopyButton } from "@/components/ui/decor/CopyButton";
import { Sparkle } from "@/components/ui/decor/Sparkle";

export function TicketPurchaseSuccess({
  reference,
  email,
  quantity,
  showStatusLink = true,
}: {
  reference: string;
  email: string;
  quantity: string;
  showStatusLink?: boolean;
}) {
  return (
    <div className="lilac-magic-card relative px-6 sm:px-8 py-10 text-center sm:text-left overflow-hidden">
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <Sparkle size={24} gold className="absolute -top-2 right-6" />
      <Sparkle size={14} gold className="absolute bottom-6 left-6 opacity-60 hidden sm:block" />

      <div className="relative z-10 flex flex-col items-center sm:items-start">
        <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-accent/10 border border-accent/20 shadow-sm">
          <AnimatedCheck size={36} className="text-accent-strong" />
        </div>

        <span className="inline-block rounded-full bg-accent/10 px-3 py-1 font-sans text-xs font-semibold text-accent-strong uppercase tracking-wider mb-2">
          Submission Successful
        </span>

        <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
          Ticket Request Received
        </h2>
        <p className="mt-1.5 font-sans text-sm text-ink-muted max-w-md">
          Your transfer details have been safely logged. Keep your reference code handy for tracking.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full rounded-field bg-gradient-to-r from-canvas-raised via-canvas-raised to-accent/5 p-4 text-sm text-ink border border-accent/25 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
            <span className="text-ink-muted font-medium text-xs uppercase tracking-wider">Reference Code:</span>
            <strong className="font-mono text-accent-strong text-lg tracking-wide">{reference}</strong>
          </div>
          <div className="self-center sm:self-auto">
            <CopyButton text={reference} label="Copy reference" />
          </div>
        </div>

        <div className="mt-7 space-y-3.5 font-sans text-sm leading-relaxed text-ink-muted border-t border-hairline pt-6 w-full">
          <div className="flex items-start gap-2.5">
            <span className="text-accent-strong font-bold mt-0.5">•</span>
            <p className="text-left">
              We verify bank transfers manually, typically within 48 to 72 hours. Once verified, your unique QR ticket{Number(quantity) === 1 ? "" : "s"} will be emailed directly to <strong className="text-ink">{email}</strong>.
            </p>
          </div>

          {showStatusLink && (
            <div className="flex items-start gap-2.5">
              <span className="text-accent-strong font-bold mt-0.5">•</span>
              <p className="text-left">
                You can track your approval progress anytime via our{" "}
                <Link href="/tickets/status" className="text-accent-strong underline underline-offset-4 font-medium hover:opacity-80 transition-opacity">
                  Ticket Status Portal
                </Link>{" "}
                using your phone number or email address.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
