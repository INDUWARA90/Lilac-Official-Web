import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireCheckin } from "@/lib/checkin-auth";
import { getTicketByToken } from "@/lib/tickets";
import { CheckinPanel } from "@/components/checkin/CheckinPanel";

export const metadata: Metadata = { title: "Ticket", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ScanResultPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  await requireCheckin();
  const { token } = await params;

  const lookup = await getTicketByToken(token);
  if (!lookup) notFound();

  const { ticket, purchaseReference, purchaseStatus } = lookup;
  const valid = purchaseStatus === "approved";
  const checkedIn = Boolean(ticket.checked_in_at);

  return (
    <div className="mx-auto max-w-sm px-6 py-10 text-center">
      <p className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
        {purchaseReference}
      </p>
      <h1 className="mt-2 text-2xl text-ink">{ticket.holder_name}</h1>
      <p className="font-sans text-sm text-ink-muted">{ticket.seat_label}</p>

      {!valid ? (
        <div className="mt-6 rounded-card bg-red-100 px-4 py-6 font-sans text-lg font-semibold text-red-800">
          Not a valid ticket
          <div className="mt-1 text-sm font-normal">{purchaseStatus.replace("_", " ")}</div>
        </div>
      ) : checkedIn ? (
        <div className="mt-6 rounded-card bg-amber-100 px-4 py-6 font-sans text-lg font-semibold text-amber-800">
          Already checked in
          <div className="mt-1 text-sm font-normal">
            {new Date(ticket.checked_in_at as string).toLocaleString("en-LK", {
              hour: "2-digit",
              minute: "2-digit",
              day: "numeric",
              month: "short",
            })}
          </div>
        </div>
      ) : (
        <CheckinPanel token={token} />
      )}

      <a href="/checkin" className="mt-8 inline-block font-sans text-sm text-accent-strong">
        ← Scan another
      </a>
    </div>
  );
}
