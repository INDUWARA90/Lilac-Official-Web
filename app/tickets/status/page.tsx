import type { Metadata } from "next";
import { SiteFrame } from "@/components/ui/SiteFrame";
import { TicketStatusLookup } from "@/components/tickets/TicketStatusLookup";

export const metadata: Metadata = { title: "Check your ticket" };

export default function TicketStatusPage() {
  return (
    <SiteFrame>
      <div className="py-12">
        <h1 className="text-3xl text-ink">Check your ticket</h1>
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
