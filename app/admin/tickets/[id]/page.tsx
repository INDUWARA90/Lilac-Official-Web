import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { slipDownloadUrl } from "@/lib/tickets";
import { ticketUrl } from "@/lib/tickets";
import { getDrawUnlocked } from "@/lib/app-config";
import { AdminShell } from "@/components/admin/AdminShell";
import { formatLkr, PURCHASE_STATUS_LABEL } from "@/lib/tickets-shared";
import { TicketReviewActions } from "@/components/admin/TicketReviewActions";
import { TicketCheckinToggle } from "@/components/admin/TicketCheckinToggle";

export const metadata: Metadata = { title: "Ticket purchase", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function TicketPurchasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAdmin();
  const { id } = await params;
  const db = createAdminClient();
  void getDrawUnlocked(); // warm the shared cache — AdminShell needs it too, see lib/app-config.ts

  const { data: purchase } = await db
    .from("ticket_purchases")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!purchase) notFound();

  const [{ data: tickets }, slipUrl] = await Promise.all([
    db
      .from("tickets")
      .select("id, token, seat_label, checked_in_at, checked_in_by")
      .eq("purchase_id", purchase.id)
      .order("seat_label", { ascending: true }),
    slipDownloadUrl(purchase.slip_path),
  ]);

  const slipIsPdf = purchase.slip_path.toLowerCase().endsWith(".pdf");

  return (
    <AdminShell email={session.email}>
      <Link href="/admin/tickets" className="font-sans text-sm text-accent-strong hover:underline">
        ← All tickets
      </Link>

      <h1 className="mt-3 text-2xl text-ink">{purchase.reference}</h1>
      <p className="mt-1 font-sans text-sm text-ink-muted">
        {PURCHASE_STATUS_LABEL[purchase.status]} ·{" "}
        {new Date(purchase.created_at).toLocaleString()}
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-card border border-hairline p-4 font-sans text-sm">
          <h2 className="font-semibold uppercase tracking-wider text-ink-muted text-xs">Buyer</h2>
          <p className="mt-2 text-ink">{purchase.name}</p>
          <p className="text-ink-muted">
            <a href={`mailto:${purchase.email}`} className="text-accent-strong">
              {purchase.email}
            </a>
          </p>
          <p className="text-ink-muted">{purchase.phone}</p>
          <p className="mt-3 text-ink">
            {purchase.quantity} ticket{purchase.quantity === 1 ? "" : "s"} ·{" "}
            {formatLkr(purchase.amount_lkr)}
          </p>
          {purchase.review_note && (
            <p className="mt-3 rounded-field bg-canvas-raised p-2 text-ink-muted">
              Note: {purchase.review_note}
            </p>
          )}
          {purchase.reviewed_by && (
            <p className="mt-2 text-xs text-ink-muted">
              Reviewed by {purchase.reviewed_by}
              {purchase.reviewed_at
                ? ` on ${new Date(purchase.reviewed_at).toLocaleString()}`
                : ""}
            </p>
          )}
        </div>

        <div className="rounded-card border border-hairline p-4">
          <h2 className="font-sans text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Bank transfer slip
          </h2>
          {slipUrl ? (
            slipIsPdf ? (
              <a
                href={slipUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block font-sans text-sm text-accent-strong underline"
              >
                Open slip (PDF)
              </a>
            ) : (
              <a href={slipUrl} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element -- signed one-off Storage URL */}
                <img
                  src={slipUrl}
                  alt="Bank transfer slip"
                  className="mt-3 max-h-96 w-full rounded-field object-contain ring-1 ring-hairline"
                />
              </a>
            )
          ) : (
            <p className="mt-3 font-sans text-sm text-red-600">Slip file not found.</p>
          )}
        </div>
      </div>

      {purchase.status === "pending_review" && (
        <div className="mt-6">
          <TicketReviewActions purchaseId={purchase.id} />
        </div>
      )}

      {(tickets ?? []).length > 0 && (
        <>
          <h2 className="mt-8 text-lg text-ink">Issued tickets</h2>
          <table className="mt-3 w-full border-collapse font-sans text-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-ink-muted">
                <th className="py-2 pr-4 font-medium">Seat</th>
                <th className="py-2 pr-4 font-medium">Ticket link</th>
                <th className="py-2 pr-4 font-medium">Checked in</th>
                <th className="py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {(tickets ?? []).map((t) => (
                <tr key={t.id} className="border-b border-hairline">
                  <td className="py-2 pr-4">{t.seat_label}</td>
                  <td className="py-2 pr-4">
                    <a
                      href={ticketUrl(t.token)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-strong hover:underline"
                    >
                      open
                    </a>
                  </td>
                  <td className="py-2 pr-4 text-ink-muted">
                    {t.checked_in_at
                      ? new Date(t.checked_in_at).toLocaleString()
                      : "—"}
                  </td>
                  <td className="py-2">
                    <TicketCheckinToggle token={t.token} checkedIn={Boolean(t.checked_in_at)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </AdminShell>
  );
}
