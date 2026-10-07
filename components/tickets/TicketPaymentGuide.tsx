import { Sparkle } from "@/components/ui/decor/Sparkle";
import { CopyButton } from "@/components/ui/decor/CopyButton";
import { formatLkr } from "@/lib/tickets-shared";
import type { TicketBank } from "@/components/tickets/ticket-purchase-types";

export function TicketPaymentGuide({
  seatingPriceLkr,
  standingPriceLkr,
  bank,
}: {
  seatingPriceLkr: number;
  standingPriceLkr: number;
  bank: TicketBank;
}) {
  return (
    <div className="lailac-magic-card p-5 sm:p-7 space-y-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-bl-full pointer-events-none" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkle size={16} gold />
          <h3 className="font-serif text-lg text-ink font-medium">Step-by-Step Payment Guide</h3>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-[11px] font-semibold text-accent-strong uppercase tracking-wider">
          Secure Transfer
        </span>
      </div>

      <ol className="space-y-4 font-sans text-sm text-ink-muted pt-2">
        <li className="flex gap-3.5 items-start">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent/15 font-bold text-accent-strong text-xs mt-0.5">1</span>
          <div className="flex-1">
            Transfer exactly <strong className="text-ink">{formatLkr(seatingPriceLkr)}</strong> per seating ticket or <strong className="text-ink">{formatLkr(standingPriceLkr)}</strong> per standing ticket to our official account:
            <div className="mt-2.5 rounded-field bg-canvas-raised p-4 font-mono text-xs sm:text-sm text-ink space-y-2 border border-hairline shadow-inner">
              {bank.name && <div className="font-sans font-bold text-ink pb-1.5 border-b border-hairline text-base">{bank.name}</div>}
              {bank.accountName && <div className="flex justify-between"><span className="text-ink-muted font-sans">A/C Name:</span> <span className="font-medium">{bank.accountName}</span></div>}
              {bank.accountNumber && (
                <div className="flex justify-between items-center">
                  <span className="text-ink-muted font-sans">A/C Number:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold tracking-wide text-accent-strong">{bank.accountNumber}</span>
                    <CopyButton text={bank.accountNumber} label="Copy A/C" />
                  </div>
                </div>
              )}
              {bank.branch && <div className="flex justify-between"><span className="text-ink-muted font-sans">Branch:</span> <span>{bank.branch}</span></div>}
              {bank.instructions && <div className="pt-2 text-ink-muted font-sans italic text-xs border-t border-hairline/50">{bank.instructions}</div>}
              {!bank.name && !bank.accountNumber && (
                <div className="text-red-600 font-sans font-medium">Bank details are currently unavailable — please contact the organiser.</div>
              )}
            </div>
          </div>
        </li>

        <li className="flex gap-3.5 items-start">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent/15 font-bold text-accent-strong text-xs mt-0.5">2</span>
          <div>Take a clear photo, screenshot, or export a PDF receipt of your completed transaction transfer slip.</div>
        </li>

        <li className="flex gap-3.5 items-start">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent/15 font-bold text-accent-strong text-xs mt-0.5">3</span>
          <div>Fill in your details below, attach your slip, and submit your request for fast verification.</div>
        </li>
      </ol>
    </div>
  );
}
