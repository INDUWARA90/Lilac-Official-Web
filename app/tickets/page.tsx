import type { Metadata } from "next";
import Link from "next/link";
import { SiteFrame } from "@/components/ui/SiteFrame";
import { Sparkle } from "@/components/ui/decor/Sparkle";
import { SeatsMeter } from "@/components/ui/decor/SeatsMeter";
import { CountUp } from "@/components/ui/decor/CountUp";
import { Reveal } from "@/components/ui/decor/Reveal";
import { getAvailability, getTicketSettings } from "@/lib/tickets";
import { formatLkr, MAX_TICKETS_PER_PURCHASE } from "@/lib/tickets-shared";
import { TicketPurchaseForm } from "@/components/tickets/TicketPurchaseForm";

export const metadata: Metadata = { title: "Tickets" };

// Was `force-dynamic`. Capacity is enforced atomically at write time by the
// `create_ticket_purchase` RPC (see lib/tickets.ts), so this page's displayed
// availability doesn't need to be live on every request — ISR (30s ceiling)
// plus revalidatePath("/tickets") right after a purchase/approval/settings
// change (see lib/tickets.ts) keeps it accurate without a Supabase round trip
// on every idle visit.
export const revalidate = 30;

export default async function TicketsPage() {
  const [availability, settings] = await Promise.all([getAvailability(), getTicketSettings()]);
  const canBuy = availability.salesOpen && availability.left > 0;

  return (
    <SiteFrame>
      <div className="py-12">
        <div className="relative inline-block">
          <Sparkle size={18} gold className="absolute -top-2 -right-5" />
          <h1 className="text-3xl text-ink">Event tickets</h1>
        </div>
        <p className="mt-3 font-sans text-base leading-relaxed text-ink-muted">
          {formatLkr(settings.priceLkr)} per ticket — admission to the Lilac event.{" "}
          <span className="text-ink">
            {availability.left} of {availability.capacity} left.
          </span>
        </p>
        <Reveal className="mt-5">
          <div className="lilac-magic-card lilac-shine">
            <div className="flex items-stretch">
              <div className="flex-1 px-5 py-4">
                <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
                  Admission
                </p>
                <p className="mt-1 font-serif text-2xl text-ink">{formatLkr(settings.priceLkr)}</p>
                <p className="font-sans text-xs text-ink-muted">per ticket</p>
              </div>
              {/* Perforated stub edge, like a real ticket. */}
              <div className="relative flex w-28 flex-col items-center justify-center border-l-2 border-dashed border-hairline px-3 py-4 text-center">
                <span aria-hidden className="absolute -top-2 -left-[9px] size-4 rounded-full bg-canvas ring-1 ring-hairline" />
                <span aria-hidden className="absolute -bottom-2 -left-[9px] size-4 rounded-full bg-canvas ring-1 ring-hairline" />
                <p className="font-serif text-2xl text-accent-strong">
                  <CountUp value={availability.left} />
                </p>
                <p className="font-sans text-xs text-ink-muted">seats left</p>
              </div>
            </div>
            <div className="px-5 pb-4">
              <SeatsMeter taken={availability.taken} capacity={availability.capacity} />
            </div>
          </div>
        </Reveal>
        <p className="mt-3 font-sans text-sm text-ink-muted">
          Already bought a ticket?{" "}
          <Link href="/tickets/status" className="text-accent-strong underline">
            Check your ticket
          </Link>
          .
        </p>

        {canBuy ? (
          <div className="mt-8">
            <TicketPurchaseForm
              priceLkr={settings.priceLkr}
              maxQuantity={Math.min(MAX_TICKETS_PER_PURCHASE, availability.left)}
              bank={{
                name: settings.bankName,
                accountName: settings.bankAccountName,
                accountNumber: settings.bankAccountNumber,
                branch: settings.bankBranch,
                instructions: settings.bankInstructions,
              }}
            />
          </div>
        ) : (
          <p className="lilac-magic-card mt-8 px-4 py-3 font-sans text-sm text-ink">
            {availability.salesOpen
              ? "Sorry — tickets are sold out."
              : "Ticket sales are closed."}
          </p>
        )}
      </div>
    </SiteFrame>
  );
}
