import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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
  // This is an access switch, not merely a navigation preference.  Returning a
  // 404 also prevents bookmarked or manually-entered URLs from exposing the
  // ticket purchase page after it has been deactivated in the admin area.
  const settings = await getTicketSettings();
  if (!settings.ticketLinksVisible) notFound();
  const availability = await getAvailability();
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
              <div key={label} className="lailac-magic-card lailac-shine">
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
        {availability.ticketLinksVisible && (
          <div className="group relative mt-6 inline-flex max-w-md items-center justify-between gap-4 overflow-hidden rounded-full border border-[#b79ddb]/40 bg-gradient-to-r from-white/95 via-[#f9f5ff]/90 to-[#f3ebff]/80 px-5 py-2.5 shadow-[0_12px_32px_-12px_rgba(110,80,160,0.2)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-[#7b539f]/60 hover:shadow-[0_18px_40px_-12px_rgba(110,80,160,0.3)]">
            {/* Ambient inner glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-6 -top-6 size-20 rounded-full bg-[#b79ddb]/20 blur-xl transition-opacity duration-300 group-hover:opacity-100"
            />

            <div className="flex items-center gap-2.5">
              {/* Animated Live Dot Indicator */}
              <span className="relative flex size-2.5 shrink-0 items-center justify-center">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#9467c8] opacity-75" />
                <span className="relative size-2 rounded-full bg-[#7b539f]" />
              </span>

              <span className="font-sans text-xs font-medium text-ink-muted sm:text-sm">
                Already bought a ticket?
              </span>
            </div>

            <Link
              href="/tickets/status"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#7b539f]/10 px-3.5 py-1 font-sans text-xs font-semibold text-[#7b539f] transition-all duration-300 group-hover:bg-[#7b539f] group-hover:text-white group-hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7b539f]/40"
            >
              <span>Check status</span>
              <span
                aria-hidden="true"
                className="inline-block text-xs transition-transform duration-300 group-hover:translate-x-1"
              >
                →
              </span>
            </Link>
          </div>
        )}

        {canBuy ? (
          <div className="mt-8">
            <TicketPurchaseForm
              seatingPriceLkr={settings.seatingPriceLkr}
              standingPriceLkr={settings.standingPriceLkr}
              seatingLeft={availability.seating.left}
              standingLeft={availability.standing.left}
              ticketLinksVisible={availability.ticketLinksVisible}
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
          <p className="lailac-magic-card mt-8 px-4 py-3 font-sans text-sm text-ink">
            {availability.salesOpen
              ? "Sorry — tickets are sold out."
              : "Ticket sales are closed."}
          </p>
        )}
      </div>
    </SiteFrame>
  );
}
