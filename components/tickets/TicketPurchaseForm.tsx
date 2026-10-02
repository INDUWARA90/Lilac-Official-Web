"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { SelectField } from "@/components/ui/SelectField";
import { Sparkle } from "@/components/ui/decor/Sparkle";
import { AnimatedCheck } from "@/components/ui/decor/AnimatedCheck";
import { CopyButton } from "@/components/ui/decor/CopyButton";
import { createAnonClient } from "@/lib/supabase/client";
import { ticketPurchaseSchema } from "@/lib/validation/ticket";
import {
  ALLOWED_SLIP_TYPES,
  MAX_SLIP_BYTES,
  formatLkr,
} from "@/lib/tickets-shared";

type FieldErrors = Partial<Record<string, string>>;

type Bank = {
  name: string;
  accountName: string;
  accountNumber: string;
  branch: string;
  instructions: string;
};

export function TicketPurchaseForm({
  priceLkr,
  maxQuantity,
  bank,
}: {
  priceLkr: number;
  maxQuantity: number;
  bank: Bank;
}) {
  const [values, setValues] = useState({ name: "", email: "", phone: "", quantity: "1" });
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ reference: string } | null>(null);

  // Generate a temporary object URL for image previews of the slip
  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const qtyOptions = useMemo(
    () => Array.from({ length: Math.max(1, maxQuantity) }, (_, i) => String(i + 1)),
    [maxQuantity],
  );
  const total = priceLkr * (Number(values.quantity) || 1);

  function set<K extends keyof typeof values>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function uploadSlip(): Promise<{ path: string } | { error: string }> {
    if (!file) return { error: "Attach a photo or PDF of your bank transfer slip." };
    if (!ALLOWED_SLIP_TYPES.includes(file.type as (typeof ALLOWED_SLIP_TYPES)[number])) {
      return { error: "Use a JPG, PNG, WebP or PDF." };
    }
    if (file.size > MAX_SLIP_BYTES) {
      return { error: `That file is over ${Math.round(MAX_SLIP_BYTES / (1024 * 1024))} MB.` };
    }
    const urlRes = await fetch("/api/tickets/upload-url", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ filename: file.name, size: file.size, contentType: file.type }),
    });
    const urlData = (await urlRes.json()) as {
      ok: boolean;
      error?: string;
      bucket?: string;
      path?: string;
      token?: string;
    };
    if (!urlData.ok || !urlData.path || !urlData.token || !urlData.bucket) {
      return { error: urlData.error ?? "Could not start the upload." };
    }
    const { error } = await createAnonClient()
      .storage.from(urlData.bucket)
      .uploadToSignedUrl(urlData.path, urlData.token, file, { contentType: file.type });
    if (error) return { error: "The upload failed. Please try again." };
    return { path: urlData.path };
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setBusy(true);
    try {
      const uploaded = await uploadSlip();
      if ("error" in uploaded) {
        setErrors((x) => ({ ...x, slipPath: uploaded.error }));
        setBusy(false);
        return;
      }

      const candidate = { ...values, slipPath: uploaded.path };
      const parsed = ticketPurchaseSchema.safeParse(candidate);
      if (!parsed.success) {
        const flat = z.flattenError(parsed.error).fieldErrors;
        const mapped: FieldErrors = {};
        for (const [k, v] of Object.entries(flat)) if (v?.length) mapped[k] = v[0];
        setErrors(mapped);
        setBusy(false);
        return;
      }

      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(candidate),
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        fieldErrors?: Record<string, string[]>;
        reference?: string;
      };
      if (res.ok && data.ok && data.reference) {
        setDone({ reference: data.reference });
        return;
      }
      if (data.fieldErrors) {
        const mapped: FieldErrors = {};
        for (const [k, v] of Object.entries(data.fieldErrors)) if (v?.length) mapped[k] = v[0];
        setErrors(mapped);
      }
      setFormError(data.error ?? "Something went wrong. Please try again.");
    } catch {
      setFormError("We couldn't reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="lilac-magic-card relative px-6 sm:px-8 py-10 text-center sm:text-left overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

        <Sparkle size={24} gold className="absolute -top-2 right-6" />
        <Sparkle size={14} gold className="absolute bottom-6 left-6 opacity-60 hidden sm:block" />

        <div className="relative z-10 flex flex-col items-center sm:items-start">
          {/* Animated Check with a soft glowing badge wrapper */}
          <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-accent/10 border border-accent/20 shadow-sm">
            <AnimatedCheck size={36} className="text-accent-strong" />
          </div>

          <span className="inline-block rounded-full bg-accent/10 px-3 py-1 font-sans text-xs font-semibold text-accent-strong uppercase tracking-wider mb-2">
            Submission Successful
          </span>

          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
            Ticket Request Received
          </h2>
          <p className="mt-1.5 font-sans text-sm text-ink-muted max-w-md">
            Your transfer details have been safely logged. Keep your reference code handy for tracking.
          </p>

          {/* Enhanced Reference Box */}
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full rounded-field bg-gradient-to-r from-canvas-raised via-canvas-raised to-accent/5 p-4 text-sm text-ink border border-accent/25 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
              <span className="text-ink-muted font-medium text-xs uppercase tracking-wider">Reference Code:</span>
              <strong className="font-mono text-accent-strong text-lg tracking-wide">{done.reference}</strong>
            </div>
            <div className="self-center sm:self-auto">
              <CopyButton text={done.reference} label="Copy reference" />
            </div>
          </div>

          {/* Details / Next Steps Section */}
          <div className="mt-7 space-y-3.5 font-sans text-sm leading-relaxed text-ink-muted border-t border-hairline pt-6 w-full">
            <div className="flex items-start gap-2.5">
              <span className="text-accent-strong font-bold mt-0.5">•</span>
              <p className="text-left">
                We verify bank transfers manually, typically within 48 to 72 hours. Once verified, your unique QR ticket{Number(values.quantity) === 1 ? "" : "s"} will be emailed directly to <strong className="text-ink">{values.email}</strong>.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="text-accent-strong font-bold mt-0.5">•</span>
              <p className="text-left">
                You can track your approval progress anytime via our{" "}
                <Link href="/tickets/status" className="text-accent-strong underline underline-offset-4 font-medium hover:opacity-80 transition-opacity">
                  Ticket Status Portal
                </Link>{" "}
                using your phone number or email address.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="lilac-stagger flex flex-col gap-6">

      {/* Instructions Card */}
      <div className="lilac-magic-card p-5 sm:p-7 space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-bl-full pointer-events-none" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkle size={16} gold />
            <h3 className="font-serif text-lg text-ink font-medium">Step-by-Step Payment Guide</h3>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-[11px] font-semibold text-accent-strong uppercase tracking-wider">
            Secure Transfer
          </span>
        </div>

        <ol className="space-y-4 font-sans text-sm text-ink-muted pt-2">
          <li className="flex gap-3.5 items-start">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent/15 font-bold text-accent-strong text-xs mt-0.5">1</span>
            <div className="flex-1">
              Transfer exactly <strong className="text-ink">{formatLkr(priceLkr)}</strong> per ticket to our official account:
              <div className="mt-2.5 rounded-field bg-canvas-raised p-4 font-mono text-xs sm:text-sm text-ink space-y-2 border border-hairline shadow-inner">
                {bank.name && <div className="font-sans font-bold text-ink pb-1.5 border-b border-hairline text-base">{bank.name}</div>}
                {bank.accountName && <div className="flex justify-between"><span className="text-ink-muted font-sans">A/C Name:</span> <span className="font-medium">{bank.accountName}</span></div>}
                {bank.accountNumber && (
                  <div className="flex justify-between items-center">
                    <span className="text-ink-muted font-sans">A/C Number:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold tracking-wide text-accent-strong">{bank.accountNumber}</span>
                      <CopyButton text={bank.accountNumber} label="Copy A/C" />
                    </div>
                  </div>
                )}
                {bank.branch && <div className="flex justify-between"><span className="text-ink-muted font-sans">Branch:</span> <span>{bank.branch}</span></div>}
                {bank.instructions && <div className="pt-2 text-ink-muted font-sans italic text-xs border-t border-hairline/50">{bank.instructions}</div>}
                {!bank.name && !bank.accountNumber && (
                  <div className="text-red-600 font-sans font-medium">Bank details are currently unavailable — please contact the organiser.</div>
                )}
              </div>
            </div>
          </li>

          <li className="flex gap-3.5 items-start">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent/15 font-bold text-accent-strong text-xs mt-0.5">2</span>
            <div>Take a clear photo, screenshot, or export a PDF receipt of your completed transaction transfer slip.</div>
          </li>

          <li className="flex gap-3.5 items-start">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent/15 font-bold text-accent-strong text-xs mt-0.5">3</span>
            <div>Fill in your details below, attach your slip, and submit your request for fast verification.</div>
          </li>
        </ol>
      </div>

      {/* Input Fields Section */}
      <div className="lilac-magic-card p-5 sm:p-7 space-y-5">
        <h3 className="font-serif text-base text-ink font-medium pb-1 border-b border-hairline">Attendee Details</h3>

        <TextField
          label="Full name"
          required
          autoComplete="name"
          placeholder="e.g. Kasun Perera"
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
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
          onChange={(e) => set("email", e.target.value)}
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
          onChange={(e) => set("phone", e.target.value)}
          error={errors.phone}
        />
        <SelectField
          label="Number of tickets"
          required
          options={qtyOptions}
          value={values.quantity}
          onChange={(e) => set("quantity", e.target.value)}
          error={errors.quantity}
        />

        {/* Enhanced File Upload Zone with Live Preview */}
        <div className="flex flex-col gap-2 font-sans text-sm font-medium text-ink-muted pt-2">
          <span className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-ink font-medium">
              Bank transfer slip <span className="text-accent-strong">*</span>
            </span>
            <span className="text-xs text-ink-muted font-normal">Max size: 10MB</span>
          </span>

          <label className={`group relative flex flex-col items-center justify-center rounded-field border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-200 ${file ? 'border-accent bg-accent/5' : 'border-hairline hover:border-accent/60 bg-canvas-raised'}`}>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                if (errors.slipPath) setErrors((x) => ({ ...x, slipPath: undefined }));
              }}
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
                  📎
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

      {/* Dynamic Total Price Calculation Card */}
      <div className="lilac-magic-card relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 sm:p-6 bg-gradient-to-r from-canvas-raised via-canvas-raised to-accent/10 border border-accent/30 shadow-sm">
        {/* Background decorative glow */}
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
    </form>
  );
}