import type { Metadata } from "next";
import { SiteFrame } from "@/components/ui/SiteFrame";
import { getAvailability, getTicketSettings } from "@/lib/tickets";
import { formatLkr, MAX_TICKETS_PER_PURCHASE } from "@/lib/tickets-shared";
import { TicketPurchaseForm } from "@/components/tickets/TicketPurchaseForm";

export const metadata: Metadata = { title: "Tickets" };
export const dynamic = "force-dynamic";

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
