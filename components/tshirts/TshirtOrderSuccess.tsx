import { Sparkle } from "@/components/ui/decor/Sparkle";

export function TshirtOrderSuccess({ reference, email }: { reference: string; email: string }) {
  return (
    <div className="lilac-magic-card relative p-8 sm:p-10 text-center overflow-hidden border border-accent/30 shadow-md">
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-accent/15 rounded-full blur-3xl pointer-events-none" />
      <Sparkle size={24} gold className="absolute top-6 right-6" />

      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-accent/15 border border-accent/30 text-accent-strong mb-5 shadow-inner">
        ✨
      </div>

      <span className="inline-block rounded-full bg-accent/10 px-3.5 py-1 font-sans text-xs font-semibold text-accent-strong uppercase tracking-wider mb-2">
        Success
      </span>

      <h2 className="font-serif text-3xl font-semibold text-ink tracking-tight">
        Order Received Successfully
      </h2>

      <p className="mt-2 font-sans text-sm text-ink-muted max-w-md mx-auto leading-relaxed">
        Your payment receipt and order details have been securely logged. Keep your reference code handy for status verification.
      </p>

      <div className="mt-6 mx-auto max-w-md flex flex-col sm:flex-row items-center justify-between gap-3 rounded-field bg-canvas-raised p-4 border border-accent/25 shadow-2xs">
        <span className="text-ink-muted font-medium text-xs uppercase tracking-wider">Reference Code:</span>
        <strong className="font-mono text-accent-strong text-lg tracking-wide">{reference}</strong>
      </div>

      <div className="mt-8 pt-6 border-t border-hairline max-w-md mx-auto text-left font-sans text-xs sm:text-sm text-ink-muted space-y-2">
        <p className="flex items-start gap-2">
          <span className="text-accent-strong font-bold">•</span>
          The team will manually review your bank transfer receipt within 24 to 48 hours.
        </p>
        <p className="flex items-start gap-2">
          <span className="text-accent-strong font-bold">•</span>
          Confirmation and pickup updates will be emailed to <strong className="text-ink">{email}</strong>.
        </p>
      </div>
    </div>
  );
}
