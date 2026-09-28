import type { Metadata } from "next";
import { SiteFrame } from "@/components/ui/SiteFrame";
import { TicketStatusLookup } from "@/components/tickets/TicketStatusLookup";
import { Sparkle } from "@/components/ui/decor/Sparkle";

export const metadata: Metadata = { title: "Check your ticket" };

export default function TicketStatusPage() {
  return (
    <SiteFrame>
      <div className="py-12">
        <div className="relative inline-block">
          <Sparkle size={16} className="absolute -top-1.5 -right-4" />
          <h1 className="text-3xl text-ink">Check your ticket</h1>
        </div>
        <p className="mt-3 max-w-md font-sans text-base leading-relaxed text-ink-muted">
          Enter the phone number or email you used to buy your ticket — no account, no
          reference number needed.
        </p>
        <div className="mt-8 max-w-md">
          <TicketStatusLookup />
        </div>
      </div>
    </SiteFrame>
  );
}
