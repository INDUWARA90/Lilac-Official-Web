import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFrame } from "@/components/ui/SiteFrame";
import { getTicketByToken, qrDataUrl } from "@/lib/tickets";
import { formatTime } from "@/lib/format";

export const metadata: Metadata = { title: "Your ticket", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function TicketPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const lookup = await getTicketByToken(token);
  if (!lookup) notFound();

  const { ticket, purchaseReference, purchaseStatus } = lookup;
  const valid = purchaseStatus === "approved";
  const checkedIn = Boolean(ticket.checked_in_at);
  const qr = valid ? await qrDataUrl(token) : null;

  return (
    <SiteFrame>
      <div className="py-10 text-center">
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
          Lilac event ticket
        </p>
        <h1 className="mt-3 text-2xl text-ink">{ticket.seat_label}</h1>
        <p className="mt-1 font-sans text-sm text-ink-muted">
          {ticket.holder_name} · {purchaseReference}
        </p>

        {valid ? (
          <>
            {qr && (
              // eslint-disable-next-line @next/next/no-img-element -- inline data-URI QR
              <img
                src={qr}
                alt="Ticket QR code"
                className="mx-auto mt-6 w-60 rounded-card bg-white p-3 ring-1 ring-hairline"
              />
            )}
            {checkedIn ? (
              <p className="mx-auto mt-5 w-fit rounded-pill bg-green-100 px-4 py-1.5 font-sans text-sm font-semibold text-green-700">
                Checked in {formatTime(ticket.checked_in_at as string)}
              </p>
            ) : (
              <p className="mt-5 font-sans text-sm text-ink-muted">
                Show this QR code at the entrance.
              </p>
            )}
          </>
        ) : (
          <p className="mx-auto mt-6 w-fit rounded-pill bg-red-50 px-4 py-1.5 font-sans text-sm font-semibold text-red-700">
            Not valid — {purchaseStatus.replace("_", " ")}
          </p>
        )}
      </div>
    </SiteFrame>
  );
}
