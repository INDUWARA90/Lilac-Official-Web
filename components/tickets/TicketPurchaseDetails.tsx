"use client";

import { useMemo } from "react";
import { TextField } from "@/components/ui/TextField";
import { SelectField } from "@/components/ui/SelectField";
import { Button } from "@/components/ui/Button";
import { MAX_TICKETS_PER_PURCHASE, formatLkr } from "@/lib/tickets-shared";
import type {
  TicketFieldErrors,
  TicketPurchaseValues,
  TicketValueSetter,
} from "@/components/tickets/ticket-purchase-types";

export function TicketPurchaseDetails({
  values,
  seatingPriceLkr,
  standingPriceLkr,
  seatingLeft,
  standingLeft,
  errors,
  file,
  previewUrl,
  busy,
  formError,
  onValueChange,
  onFileChange,
}: {
  values: TicketPurchaseValues;
  seatingPriceLkr: number;
  standingPriceLkr: number;
  seatingLeft: number;
  standingLeft: number;
  errors: TicketFieldErrors;
  file: File | null;
  previewUrl: string | null;
  busy: boolean;
  formError: string | null;
  onValueChange: TicketValueSetter;
  onFileChange: (file: File | null) => void;
}) {
  const selectedTypeLeft = values.ticketType === "seating" ? seatingLeft : standingLeft;
  const qtyOptions = useMemo(
    () =>
      Array.from(
        { length: Math.min(MAX_TICKETS_PER_PURCHASE, Math.max(1, selectedTypeLeft)) },
        (_, i) => String(i + 1),
      ),
    [selectedTypeLeft],
  );
  const priceLkr = values.ticketType === "seating" ? seatingPriceLkr : standingPriceLkr;
  const total = priceLkr * (Number(values.quantity) || 1);

  return (
    <>
      <div className="lilac-magic-card p-5 sm:p-7 space-y-5">
        <h3 className="font-serif text-base text-ink font-medium pb-1 border-b border-hairline">Attendee Details</h3>

        <SelectField
          label="Ticket type"
          required
          options={[
            ...(seatingLeft > 0 ? [`Seating — ${formatLkr(seatingPriceLkr)}`] : []),
            ...(standingLeft > 0 ? [`Standing — ${formatLkr(standingPriceLkr)}`] : []),
          ]}
          value={`${values.ticketType === "seating" ? "Seating" : "Standing"} — ${formatLkr(priceLkr)}`}
          onChange={(e) => {
            onValueChange("ticketType", e.target.value.startsWith("Seating") ? "seating" : "standing");
            onValueChange("quantity", "1");
          }}
        />

        <TextField
          label="Full name"
          required
          autoComplete="name"
          placeholder="e.g. Kasun Perera"
          value={values.name}
          onChange={(e) => onValueChange("name", e.target.value)}
          error={errors.name}
        />
        <TextField
          label="Email address"
          required
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          hint="Your QR e-ticket will be securely sent here upon approval."
          value={values.email}
          onChange={(e) => onValueChange("email", e.target.value)}
          error={errors.email}
        />
        <TextField
          label="Phone number"
          required
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="077 123 4567"
          hint="Used for quick ticket verification and lookup."
          value={values.phone}
          onChange={(e) => onValueChange("phone", e.target.value)}
          error={errors.phone}
        />
        <SelectField
          label="Number of tickets"
          required
          options={qtyOptions}
          value={values.quantity}
          onChange={(e) => onValueChange("quantity", e.target.value)}
          error={errors.quantity}
        />

        <div className="flex flex-col gap-2 font-sans text-sm font-medium text-ink-muted pt-2">
          <span className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-ink font-medium">
              Bank transfer slip <span className="text-accent-strong">*</span>
            </span>
            <span className="text-xs text-ink-muted font-normal">Max size: 10MB</span>
          </span>

          <label className={`group relative flex flex-col items-center justify-center rounded-field border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-200 ${file ? "border-accent bg-accent/5" : "border-hairline hover:border-accent/60 bg-canvas-raised"}`}>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
            />

            {file ? (
              <div className="flex flex-col items-center space-y-3 z-0 w-full">
                {previewUrl ? (
                  <div className="relative size-20 rounded-lg overflow-hidden border border-accent/30 shadow-sm">
                    <img src={previewUrl} alt="Slip preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="flex size-12 items-center justify-center rounded-full bg-accent/10 text-accent-strong font-bold text-xs">
                    PDF
                  </div>
                )}
                <div className="flex flex-col items-center space-y-0.5">
                  <span className="font-semibold text-ink text-xs sm:text-sm truncate max-w-[280px]">{file.name}</span>
                  <span className="text-xs text-accent-strong underline underline-offset-2">Click or drop a different file to replace</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2 pointer-events-none">
                <div className="flex size-10 items-center justify-center rounded-full bg-accent/10 text-accent-strong">
                  📄
                </div>
                <div className="flex flex-col items-center space-y-0.5">
                  <span className="font-semibold text-ink text-xs sm:text-sm">Click to upload transfer slip</span>
                  <span className="text-xs text-ink-muted">Supports JPG, PNG, WebP or PDF</span>
                </div>
              </div>
            )}
          </label>
          {errors.slipPath && <span className="text-xs text-red-600 font-medium">{errors.slipPath}</span>}
        </div>
      </div>

      <div className="lilac-magic-card relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 sm:p-6 bg-gradient-to-r from-canvas-raised via-canvas-raised to-accent/10 border border-accent/30 shadow-sm">
        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-accent/10 rounded-full blur-2xl pointer-events-none" />

        <div>
          <span className="font-sans text-xs uppercase tracking-wider text-ink-muted flex items-center gap-1.5 font-medium">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Total Payable Amount
          </span>
          <p className="font-serif text-3xl font-bold text-ink mt-1 tracking-tight">
            {formatLkr(total)}
          </p>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-hairline">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3.5 py-1 font-sans text-xs font-semibold text-accent-strong shadow-2xs">
            {values.quantity} {Number(values.quantity) === 1 ? "Ticket" : "Tickets"}
          </span>
          <p className="text-xs text-ink-muted mt-1.5 font-medium">
            {formatLkr(priceLkr)} per ticket
          </p>
        </div>
      </div>

      {formError && (
        <p
          role="alert"
          className="rounded-field bg-red-50 px-4 py-3 font-sans text-sm text-red-700 ring-1 ring-red-200"
        >
          {formError}
        </p>
      )}

      <Button type="submit" variant="magic" loading={busy} className="w-full sm:w-auto self-start py-3 px-8 text-base">
        Submit ticket request
      </Button>
    </>
  );
}
