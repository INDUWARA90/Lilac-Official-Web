"use client";

import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Reveal } from "@/components/ui/decor/Reveal";
import { ticketStatusLookupSchema } from "@/lib/validation/ticket";
import { FormErrorToast } from "@/components/ui/FormErrorToast";
import {
  PURCHASE_STATUS_LABEL,
  type TicketPurchaseStatus,
  type TicketType,
} from "@/lib/tickets-shared";

type FieldErrors = Partial<Record<string, string>>;

type Purchase = {
  reference: string;
  status: TicketPurchaseStatus;
  ticketType: TicketType;
  quantity: number;
  reviewNote: string | null;
  tickets: { token: string; seatLabel: string }[];
};

/**
 * The whole replacement for "we'll email you your ticket" — buyers check
 * themselves, anytime, with just the phone or email they bought with. No
 * reference needed, no login, no push notification. Shows every purchase
 * found for that contact (usually one).
 */
export function TicketStatusLookup() {
  const [contact, setContact] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<Purchase[] | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setResults(null);

    const parsed = ticketStatusLookupSchema.safeParse({ contact });
    if (!parsed.success) {
      const flat = z.flattenError(parsed.error).fieldErrors;
      const mapped: FieldErrors = {};
      for (const [k, v] of Object.entries(flat)) if (v?.length) mapped[k] = v[0];
      setErrors(mapped);
      setFormError(Object.values(mapped)[0] ?? "Please check the form and try again.");
      return;
    }
    setErrors({});

    setBusy(true);
    try {
      const res = await fetch("/api/tickets/status", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = (await res.json()) as { ok: boolean; error?: string; purchases?: Purchase[] };
      if (res.ok && data.ok && data.purchases) {
        setResults(data.purchases);
        return;
      }
      setFormError(data.error ?? "Something went wrong. Please try again.");
    } catch {
      setFormError("We couldn't reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <FormErrorToast message={formError} onDismiss={() => setFormError(null)} />
      <form onSubmit={submit} noValidate className="lailac-stagger flex flex-col gap-6">
        <TextField
          label="Phone or email"
          required
          placeholder="The one you bought your ticket with"
          value={contact}
          onChange={(e) => {
            setContact(e.target.value);
            if (errors.contact) setErrors({});
          }}
          error={errors.contact}
        />
        <Button type="submit" variant="magic" loading={busy} className="self-start">
          Check status
        </Button>
      </form>

      {results && (
        <div className="lailac-stagger flex flex-col gap-4">
          {results.map((r, i) => (
            <Reveal key={r.reference} delay={i * 100}>
              <PurchaseCard purchase={r} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}

function PurchaseCard({ purchase }: { purchase: Purchase }) {
  return (
    <div className="lailac-magic-card lailac-hover-lift p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg text-ink">{purchase.reference}</h2>
        <StatusPill status={purchase.status} />
      </div>
      <p className="mt-2 font-sans text-sm capitalize text-ink-muted">
        {purchase.ticketType} · {purchase.quantity} ticket{purchase.quantity === 1 ? "" : "s"}
      </p>

      {purchase.status === "pending_review" && (
        <p className="mt-3 font-sans text-sm leading-relaxed text-ink-muted">
          We&rsquo;re still matching your bank transfer against our account — this usually takes
          a day or two. Check back here anytime; nothing else to do for now.
        </p>
      )}

      {purchase.status === "rejected" && (
        <div className="mt-3">
          <p className="font-sans text-sm leading-relaxed text-ink-muted">
            We couldn&rsquo;t confirm this purchase.
          </p>
          {purchase.reviewNote && (
            <p className="mt-2 rounded-field bg-canvas-raised p-3 font-sans text-sm text-ink ring-1 ring-hairline">
              {purchase.reviewNote}
            </p>
          )}
        </div>
      )}

      {purchase.status === "cancelled" && (
        <p className="mt-3 font-sans text-sm leading-relaxed text-ink-muted">
          This purchase was cancelled.
        </p>
      )}

      {purchase.status === "approved" && (
        <div className="mt-4 flex flex-col gap-2">
          <p className="font-sans text-sm text-ink-muted">
            You&rsquo;re in! {purchase.tickets.length} ticket
            {purchase.tickets.length === 1 ? "" : "s"} ready.
          </p>
          {purchase.tickets.map((t) => (
            <Link
              key={t.token}
              href={`/ticket/${t.token}`}
              className="rounded-field border border-hairline px-4 py-2 font-sans text-sm text-accent-strong hover:border-accent"
            >
              {t.seatLabel} — view QR code →
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: TicketPurchaseStatus }) {
  const tone =
    status === "approved"
      ? "bg-green-100 text-green-700"
      : status === "rejected" || status === "cancelled"
        ? "bg-red-50 text-red-700"
        : "bg-canvas-raised text-ink-muted";
  return (
    <span className={`lailac-pop rounded-pill px-3 py-1 font-sans text-xs font-semibold ${tone}`}>
      {PURCHASE_STATUS_LABEL[status]}
    </span>
  );
}
