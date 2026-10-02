import type { Metadata } from "next";
import { SiteFrame } from "@/components/ui/SiteFrame";
import { TicketStatusLookup } from "@/components/tickets/TicketStatusLookup";
import { Sparkle } from "@/components/ui/decor/Sparkle";

export const metadata: Metadata = { title: "Check your ticket status" };

export default function TicketStatusPage() {
  return (
    <SiteFrame>
      <div className="py-12 sm:py-16 flex flex-col items-center">
        <div className="w-full max-w-lg">
          
          {/* Header Section */}
          <div className="text-center sm:text-left mb-8 relative">
            <div className="absolute -top-10 left-1/2 sm:left-10 w-32 h-32 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 font-sans text-xs font-semibold text-accent-strong uppercase tracking-wider mb-3">
              <Sparkle size={12} gold /> Quick Lookup
            </div>

            <div className="relative inline-block w-full">
              <Sparkle size={18} gold className="absolute -top-2 right-1/4 hidden sm:block" />
              <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-ink tracking-tight">
                Check your ticket status
              </h1>
            </div>
            
            <p className="mt-2.5 font-sans text-sm sm:text-base leading-relaxed text-ink-muted max-w-md">
              Enter the phone number or email you used to buy your ticket — no account or reference number required.
            </p>
          </div>

          {/* Form Card Container */}
          <div className="lilac-magic-card p-6 sm:p-8 relative overflow-hidden border border-accent/20 shadow-sm">
            <Sparkle size={16} gold className="absolute top-4 right-4 opacity-50" />
            <TicketStatusLookup />
          </div>

        </div>
      </div>
    </SiteFrame>
  );
}