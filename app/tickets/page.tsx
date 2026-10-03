import type { Metadata } from "next";
import Link from "next/link";
import { SiteFrame } from "@/components/ui/SiteFrame";
import { Sparkle } from "@/components/ui/decor/Sparkle";
import { SeatsMeter } from "@/components/ui/decor/SeatsMeter";
import { Reveal } from "@/components/ui/decor/Reveal";
import { getAvailability, getTicketSettings } from "@/lib/tickets";
import { formatLkr } from "@/lib/tickets-shared";
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
  const canBuy =
    availability.salesOpen &&
    (availability.seating.left > 0 || availability.standing.left > 0);

  return (
    <SiteFrame>
      <div className="py-12">
        <div className="relative inline-block">
          <Sparkle size={18} gold className="absolute -top-2 -right-5" />
          <h1 className="text-3xl text-ink">Event tickets</h1>
        </div>
        <p className="mt-3 font-sans text-base leading-relaxed text-ink-muted">
          Choose seating or standing admission. Each ticket type has its own capacity.
        </p>
        <Reveal className="mt-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {([
              {
                label: "Seating",
                price: settings.seatingPriceLkr,
                availability: availability.seating,
              },
              {
                label: "Standing",
                price: settings.standingPriceLkr,
                availability: availability.standing,
              },
            ] as const).map(({ label, price, availability: typeAvailability }) => (
              <div key={label} className="lilac-magic-card lilac-shine">
                <div className="px-5 py-4">
                  <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
                    {label}
                  </p>
                  <p className="mt-1 font-serif text-2xl text-ink">{formatLkr(price)}</p>
                  <p className="font-sans text-xs text-ink-muted">per ticket</p>
                  <p className="mt-3 font-sans text-sm text-ink">
                    {typeAvailability.left > 0
                      ? `${typeAvailability.left} of ${typeAvailability.capacity} available`
                      : "Sold out"}
                  </p>
                  <div className="mt-3">
                    <SeatsMeter
                      taken={typeAvailability.taken}
                      capacity={typeAvailability.capacity}
                    />
                  </div>
                </div>
              </div>
            ))}
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
              seatingPriceLkr={settings.seatingPriceLkr}
              standingPriceLkr={settings.standingPriceLkr}
              seatingLeft={availability.seating.left}
              standingLeft={availability.standing.left}
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
