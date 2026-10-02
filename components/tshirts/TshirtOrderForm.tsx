"use client";

import { useMemo, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { SelectField } from "@/components/ui/SelectField";
import { Sparkle } from "@/components/ui/decor/Sparkle";
import { createAnonClient } from "@/lib/supabase/client";
import { tshirtOrderSchema } from "@/lib/validation/tshirt";
import { ALLOWED_RECEIPT_TYPES, MAX_RECEIPT_BYTES, TSHIRT_SIZES } from "@/lib/tshirts-shared";
import { formatLkr } from "@/lib/tickets-shared";

type Errors = Partial<Record<string, string>>;

const FACULTIES = [
  "Faculty of Technology",
  "Faculty of Agriculture",
  "Faculty of Allied Health Sciences",
  "Faculty of Medicine",
  "Faculty of Engineering",
  "Faculty of Graduate Studies",
  "Faculty of Fisheries and Marine Sciences & Technology",
  "Faculty of Management and Finance",
  "Faculty of Humanities and Social Sciences",
  "Faculty of Science",
];

export function TshirtOrderForm({ priceLkr }: { priceLkr: number }) {
  const [values, setValues] = useState({
    name: "",
    registrationNumber: "",
    faculty: "",
    email: "",
    phone: "",
    size: "",
    quantity: "1",
  });
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  const total = useMemo(() => priceLkr * (Number(values.quantity) || 1), [priceLkr, values.quantity]);

  function set(key: keyof typeof values, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function upload() {
    if (!file) return { error: "Attach a photo or PDF of your payment receipt." };
    if (!ALLOWED_RECEIPT_TYPES.includes(file.type as never) || file.size > MAX_RECEIPT_BYTES) {
      return { error: "Use a JPG, PNG, WebP or PDF up to 5 MB." };
    }
    const res = await fetch("/api/tshirts/upload-url", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ filename: file.name, size: file.size, contentType: file.type }),
    });
    const data = (await res.json()) as { ok: boolean; error?: string; bucket?: string; path?: string; token?: string };
    if (!data.ok || !data.bucket || !data.path || !data.token) {
      return { error: data.error ?? "Could not start the upload." };
    }
    const { error } = await createAnonClient().storage.from(data.bucket).uploadToSignedUrl(data.path, data.token, file, { contentType: file.type });
    return error ? { error: "The upload failed. Please try again." } : { path: data.path };
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const uploaded = await upload();
      if ("error" in uploaded) {
        setErrors({ receiptPath: uploaded.error });
        return;
      }
      const parsed = tshirtOrderSchema.safeParse({ ...values, receiptPath: uploaded.path });
      if (!parsed.success) {
        const out: Errors = {};
        for (const [k, v] of Object.entries(z.flattenError(parsed.error).fieldErrors)) {
          if (v?.[0]) out[k] = v[0];
        }
        setErrors(out);
        return;
      }
      const res = await fetch("/api/tshirts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...values, receiptPath: uploaded.path }),
      });
      const data = (await res.json()) as { ok: boolean; reference?: string; error?: string; fieldErrors?: Record<string, string[]> };
      if (data.ok && data.reference) {
        setReference(data.reference);
      } else {
        const out: Errors = {};
        for (const [k, v] of Object.entries(data.fieldErrors ?? {})) {
          if (v?.[0]) out[k] = v[0];
        }
        setErrors(out);
        setFormError(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setFormError("We couldn't reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  // Success State View
  if (reference) {
    return (
      <div className="lilac-magic-card relative p-8 sm:p-10 text-center overflow-hidden border border-accent/30 shadow-md">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-accent/15 rounded-full blur-3xl pointer-events-none" />
        <Sparkle size={24} gold className="absolute top-6 right-6" />

        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-accent/15 border border-accent/30 text-accent-strong mb-5 shadow-inner">
          ✨
        </div>

        <span className="inline-block rounded-full bg-accent/10 px-3.5 py-1 font-sans text-xs font-semibold text-accent-strong uppercase tracking-wider mb-2">
          Success
        </span>

        <h2 className="font-serif text-3xl font-semibold text-ink tracking-tight">
          Order Received Successfully
        </h2>
        
        <p className="mt-2 font-sans text-sm text-ink-muted max-w-md mx-auto leading-relaxed">
          Your payment receipt and order details have been securely logged. Keep your reference code handy for status verification.
        </p>

        <div className="mt-6 mx-auto max-w-md flex flex-col sm:flex-row items-center justify-between gap-3 rounded-field bg-canvas-raised p-4 border border-accent/25 shadow-2xs">
          <span className="text-ink-muted font-medium text-xs uppercase tracking-wider">Reference Code:</span>
          <strong className="font-mono text-accent-strong text-lg tracking-wide">{reference}</strong>
        </div>

        <div className="mt-8 pt-6 border-t border-hairline max-w-md mx-auto text-left font-sans text-xs sm:text-sm text-ink-muted space-y-2">
          <p className="flex items-start gap-2">
            <span className="text-accent-strong font-bold">•</span>
            The team will manually review your bank transfer receipt within 24 to 48 hours.
          </p>
          <p className="flex items-start gap-2">
            <span className="text-accent-strong font-bold">•</span>
            Confirmation and pickup updates will be emailed to <strong className="text-ink">{values.email}</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="lilac-stagger flex flex-col gap-8">
      
      {/* Top Banner Guide */}
      <div className="lilac-magic-card p-5 relative overflow-hidden bg-gradient-to-r from-canvas-raised via-canvas-raised to-accent/5 border border-accent/25">
        <Sparkle size={16} gold className="absolute top-4 right-5" />
        <h3 className="font-serif text-base font-semibold text-ink flex items-center gap-2 mb-1.5">
          <span>🛍️</span> T-Shirt Pre-Order Instructions
        </h3>
        <p className="font-sans text-xs sm:text-sm text-ink-muted leading-relaxed">
          Complete the bank payment first, upload your transfer receipt slip below, and select your correct faculty from the dropdown for manual verification.
        </p>
      </div>

      {/* Section 01: Personal Details */}
      <div className="lilac-magic-card p-6 sm:p-8 space-y-5 border border-accent/20">
        <div className="flex items-center justify-between border-b border-hairline pb-3">
          <h4 className="font-serif text-sm font-semibold text-ink uppercase tracking-wider flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-accent/10 text-accent-strong text-xs font-mono">1</span>
            Personal & Student Details
          </h4>
        </div>

        <div className="space-y-4 pt-1">
          <TextField
            label="Full name"
            required
            placeholder="e.g. Perera A.B."
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            error={errors.name}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              label="Registration number"
              required
              placeholder="e.g. TG/2023/1234"
              value={values.registrationNumber}
              onChange={(e) => set("registrationNumber", e.target.value)}
              error={errors.registrationNumber}
            />
            <SelectField
              label="Faculty"
              required
              placeholder="Select your faculty"
              options={FACULTIES}
              value={values.faculty}
              onChange={(e) => set("faculty", e.target.value)}
              error={errors.faculty}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              label="Email address"
              type="email"
              required
              placeholder="you@example.com"
              value={values.email}
              onChange={(e) => set("email", e.target.value)}
              error={errors.email}
            />
            <TextField
              label="Phone number"
              type="tel"
              required
              placeholder="077 123 4567"
              value={values.phone}
              onChange={(e) => set("phone", e.target.value)}
              error={errors.phone}
            />
          </div>
        </div>
      </div>

      {/* Section 02: Order Selection & Receipt */}
      <div className="lilac-magic-card p-6 sm:p-8 space-y-5 border border-accent/20">
        <div className="flex items-center justify-between border-b border-hairline pb-3">
          <h4 className="font-serif text-sm font-semibold text-ink uppercase tracking-wider flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-accent/10 text-accent-strong text-xs font-mono">2</span>
            Sizing & Payment Receipt
          </h4>
        </div>

        <div className="space-y-5 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField
              label="T-shirt size"
              required
              placeholder="Select size"
              options={TSHIRT_SIZES}
              value={values.size}
              onChange={(e) => set("size", e.target.value)}
              error={errors.size}
            />
            <SelectField
              label="Quantity"
              required
              options={["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]}
              value={values.quantity}
              onChange={(e) => set("quantity", e.target.value)}
              error={errors.quantity}
            />
          </div>

          {/* Receipt File Upload */}
          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-sm font-medium text-ink flex items-center justify-between">
              <span>Payment receipt slip <span className="text-accent-strong">*</span></span>
              <span className="text-[11px] text-ink-muted">JPG, PNG, WebP or PDF (Max 5MB)</span>
            </label>

            <div className="relative flex flex-col items-center justify-center rounded-field border-2 border-dashed border-accent/30 bg-canvas-raised p-6 text-center hover:border-accent hover:bg-accent/5 transition-all cursor-pointer">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  setErrors((x) => ({ ...x, receiptPath: undefined }));
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="space-y-1.5 pointer-events-none">
                <span className="text-2xl">📄</span>
                <p className="font-sans text-sm font-semibold text-ink">
                  {file ? <span className="text-accent-strong">{file.name}</span> : "Click to browse or drag receipt here"}
                </p>
                <p className="font-sans text-xs text-ink-muted">
                  {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB attached` : "Upload bank transfer confirmation or deposit slip"}
                </p>
              </div>
            </div>
            {errors.receiptPath && <span className="text-xs text-red-600 mt-1">{errors.receiptPath}</span>}
          </div>
        </div>
      </div>

      {/* Pricing Summary & Submission Footer */}
      <div className="lilac-magic-card p-6 flex flex-col sm:flex-row items-center justify-between gap-5 bg-gradient-to-r from-accent/5 via-canvas-raised to-canvas-raised border border-accent/30">
        <div className="text-center sm:text-left">
          <span className="text-xs uppercase tracking-wider text-ink-muted font-semibold block">Total Payment Due</span>
          <div className="flex items-baseline gap-2 mt-0.5 justify-center sm:justify-start">
            <span className="font-serif text-3xl font-bold text-accent-strong">{formatLkr(total)}</span>
            <span className="text-xs text-ink-muted">({values.quantity || 1} item{Number(values.quantity) > 1 ? "s" : ""})</span>
          </div>
        </div>

        <Button type="submit" variant="magic" loading={busy} className="w-full sm:w-auto px-8 py-3 text-base shadow-md">
          Submit T-shirt order
        </Button>
      </div>

      {formError && (
        <p role="alert" className="rounded-field bg-red-50 px-4 py-3 font-sans text-sm text-red-700 ring-1 ring-red-200">
          {formError}
        </p>
      )}

    </form>
  );
}