import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFrame } from "@/components/ui/SiteFrame";
import { TicketPassCard } from "@/components/tickets/TicketPassCard";
import { getTicketByToken, qrDataUrl } from "@/lib/tickets";

export const metadata: Metadata = { title: "Your ticket", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Secure server route: the ticket token is looked up before rendering the pass. */
export default async function TicketPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const lookup = await getTicketByToken(token);
  if (!lookup) notFound();

  const qr = lookup.purchaseStatus === "approved" ? await qrDataUrl(token) : null;
  return (
    <SiteFrame>
      <div className="py-10 text-center">
        <TicketPassCard {...lookup} qr={qr} />
      </div>
    </SiteFrame>
  );
}
