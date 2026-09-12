import type { Metadata } from "next";
import Link from "next/link";
import { SiteFrame } from "@/components/ui/SiteFrame";
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
        <h1 className="text-3xl text-ink">Event tickets</h1>
        <p className="mt-3 font-sans text-base leading-relaxed text-ink-muted">
          {formatLkr(settings.priceLkr)} per ticket — admission to the Lilac event.{" "}
          <span className="text-ink">
            {availability.left} of {availability.capacity} left.
          </span>
        </p>
        <p className="mt-2 font-sans text-sm text-ink-muted">
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
          <p className="mt-8 rounded-card bg-canvas-raised px-4 py-3 font-sans text-sm text-ink ring-1 ring-hairline">
            {availability.salesOpen
              ? "Sorry — tickets are sold out."
              : "Ticket sales are closed."}
          </p>
        )}
      </div>
    </SiteFrame>
  );
}
