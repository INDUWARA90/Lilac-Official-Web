"use client";

import { useMemo, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { SelectField } from "@/components/ui/SelectField";
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
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ reference: string } | null>(null);

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
      <div className="rounded-card bg-canvas-raised px-5 py-6 ring-1 ring-hairline">
        <h2 className="text-lg text-ink">Request received</h2>
        <p className="mt-2 font-sans text-sm leading-relaxed text-ink-muted">
          Your reference is <strong className="text-ink">{done.reference}</strong>. We&rsquo;re
          verifying your bank transfer and will email your e-ticket
          {Number(values.quantity) === 1 ? "" : "s"} with the QR code
          {Number(values.quantity) === 1 ? "" : "s"} once it&rsquo;s confirmed. Check your inbox
          (and spam).
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <ol className="rounded-card border border-hairline p-4 font-sans text-sm text-ink-muted">
        <li className="mb-2">
          <span className="font-semibold text-ink">1.</span> Transfer{" "}
          <strong className="text-ink">{formatLkr(priceLkr)}</strong> per ticket to:
          <div className="mt-2 rounded-field bg-canvas-raised p-3 text-ink">
            {bank.name && <div>{bank.name}</div>}
            {bank.accountName && <div>A/C name: {bank.accountName}</div>}
            {bank.accountNumber && <div>A/C no: {bank.accountNumber}</div>}
            {bank.branch && <div>Branch: {bank.branch}</div>}
            {bank.instructions && <div className="mt-1 text-ink-muted">{bank.instructions}</div>}
            {!bank.name && !bank.accountNumber && (
              <div className="text-red-600">Bank details not set — contact the organiser.</div>
            )}
          </div>
        </li>
        <li className="mb-2">
          <span className="font-semibold text-ink">2.</span> Upload your transfer slip below.
        </li>
        <li>
          <span className="font-semibold text-ink">3.</span> Submit — we verify and email your
          ticket.
        </li>
      </ol>

      <TextField
        label="Full name"
        required
        autoComplete="name"
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
        hint="Your e-ticket is sent here."
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

      <label className="flex flex-col gap-1.5 font-sans text-sm font-medium text-ink-muted">
        Bank transfer slip <span className="text-accent-strong">*</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            if (errors.slipPath) setErrors((x) => ({ ...x, slipPath: undefined }));
          }}
          className="text-sm text-ink file:mr-3 file:rounded-field file:border file:border-hairline file:bg-transparent file:px-3 file:py-1.5 file:text-accent-strong"
        />
        {errors.slipPath && <span className="text-xs text-red-600">{errors.slipPath}</span>}
      </label>

      <p className="font-sans text-sm text-ink">
        Total: <strong>{formatLkr(total)}</strong> for {values.quantity} ticket
        {values.quantity === "1" ? "" : "s"}
      </p>

      {formError && (
        <p
          role="alert"
          className="rounded-field bg-red-50 px-3 py-2 font-sans text-sm text-red-700 ring-1 ring-red-200"
        >
          {formError}
        </p>
      )}

      <Button type="submit" loading={busy} className="self-start">
        Submit ticket request
      </Button>
    </form>
  );
}
