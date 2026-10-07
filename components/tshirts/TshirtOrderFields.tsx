"use client";

import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { SelectField } from "@/components/ui/SelectField";
import { Sparkle } from "@/components/ui/decor/Sparkle";
import { MAX_TSHIRT_ORDER_QUANTITY, TSHIRT_COLORS, TSHIRT_SIZES } from "@/lib/tshirts-shared";
import { formatLkr } from "@/lib/tickets-shared";
import { CopyButton } from "@/components/ui/decor/CopyButton";
import type { TicketBank } from "@/components/tickets/ticket-purchase-types";

export type TshirtOrderValues = {
  name: string;
  registrationNumber: string;
  faculty: string;
  email: string;
  phone: string;
  items: Array<{ size: string; color: string }>;
};

type Errors = Partial<Record<string, string>>;
type SetOrderValue = <K extends keyof TshirtOrderValues>(key: K, value: string) => void;

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

export function TshirtOrderFields({
  values,
  errors,
  file,
  busy,
  formError,
  total,
  bank,
  onValueChange,
  onItemChange,
  onFileChange,
  onSubmit,
}: {
  values: TshirtOrderValues;
  errors: Errors;
  file: File | null;
  busy: boolean;
  formError: string | null;
  total: number;
  bank: TicketBank;
  onValueChange: SetOrderValue;
  onItemChange: (index: number, key: "size" | "color", value: string) => void;
  onFileChange: (file: File | null) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSubmit} noValidate className="lilac-stagger flex min-w-0 flex-col gap-6 sm:gap-8">
      <div className="lilac-magic-card relative overflow-hidden border border-accent/25 bg-gradient-to-r from-canvas-raised via-canvas-raised to-accent/5 p-4 sm:p-5">
        <Sparkle size={16} gold className="absolute right-4 top-4 sm:right-5" />
        <h3 className="mb-1.5 flex items-start gap-2 pr-5 font-serif text-base font-semibold text-ink">
          <span>🛍️</span> T-Shirt Pre-Order Instructions
        </h3>
        <p className="font-sans text-xs sm:text-sm text-ink-muted leading-relaxed">
          Complete the bank payment first, upload your transfer receipt slip below, and select your correct faculty from the dropdown for manual verification.
        </p>
        <div className="mt-4 rounded-field border border-hairline bg-white/70 p-3 font-sans text-xs text-ink sm:p-4 sm:text-sm">
          <p className="mb-2 font-semibold text-ink">Bank details</p>
          {bank.name && <p className="font-semibold">{bank.name}</p>}
          {bank.accountName && <p><span className="text-ink-muted">Account name:</span> {bank.accountName}</p>}
          {bank.accountNumber && (
            <div className="flex flex-wrap items-center gap-2">
              <span><span className="text-ink-muted">Account number:</span> <strong>{bank.accountNumber}</strong></span>
              <CopyButton text={bank.accountNumber} label="Copy account" />
            </div>
          )}
          {bank.branch && <p><span className="text-ink-muted">Branch:</span> {bank.branch}</p>}
          {bank.instructions && <p className="mt-2 border-t border-hairline pt-2 text-ink-muted">{bank.instructions}</p>}
          {!bank.name && !bank.accountNumber && (
            <p className="text-red-600">Bank details are currently unavailable — please contact the organiser.</p>
          )}
        </div>
      </div>

      <div className="lilac-magic-card space-y-5 border border-accent/20 p-4 sm:p-6 md:p-8">
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
            onChange={(e) => onValueChange("name", e.target.value)}
            error={errors.name}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              label="Registration number"
              required
              placeholder="e.g. TG/2023/1234"
              value={values.registrationNumber}
              onChange={(e) => onValueChange("registrationNumber", e.target.value)}
              error={errors.registrationNumber}
            />
            <SelectField
              label="Faculty"
              required
              placeholder="Select your faculty"
              options={FACULTIES}
              value={values.faculty}
              onChange={(e) => onValueChange("faculty", e.target.value)}
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
              onChange={(e) => onValueChange("email", e.target.value)}
              error={errors.email}
            />
            <TextField
              label="Phone number"
              type="tel"
              required
              placeholder="077 123 4567"
              value={values.phone}
              onChange={(e) => onValueChange("phone", e.target.value)}
              error={errors.phone}
            />
          </div>
        </div>
      </div>

      <div className="lilac-magic-card space-y-5 border border-accent/20 p-4 sm:p-6 md:p-8">
        <div className="flex items-center justify-between border-b border-hairline pb-3">
          <h4 className="font-serif text-sm font-semibold text-ink uppercase tracking-wider flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-accent/10 text-accent-strong text-xs font-mono">2</span>
            Sizing & Payment Receipt
          </h4>
        </div>

        <div className="space-y-5 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField
              label="Quantity"
              required
              options={Array.from({ length: MAX_TSHIRT_ORDER_QUANTITY }, (_, i) => String(i + 1))}
              value={String(values.items.length)}
              onChange={(e) => onValueChange("items", e.target.value)}
              error={errors.items}
            />
          </div>
          <div className="space-y-4">
            {values.items.map((item, index) => (
              <div key={index} className="grid grid-cols-1 gap-4 rounded-field border border-hairline bg-canvas-raised p-4 sm:grid-cols-2">
                <p className="font-sans text-sm font-semibold text-ink sm:col-span-2">T-shirt {index + 1}</p>
                <SelectField
                  label="T-shirt size"
                  required
                  placeholder="Select size"
                  options={TSHIRT_SIZES}
                  value={item.size}
                  onChange={(e) => onItemChange(index, "size", e.target.value)}
                  error={errors[`items.${index}.size`]}
                />
                <SelectField
                  label="Color"
                  required
                  placeholder="Select color"
                  options={TSHIRT_COLORS}
                  value={item.color}
                  onChange={(e) => onItemChange(index, "color", e.target.value)}
                  error={errors[`items.${index}.color`]}
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="flex flex-col gap-0.5 font-sans text-sm font-medium text-ink sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <span>Payment receipt slip <span className="text-accent-strong">*</span></span>
              <span className="text-xs text-ink-muted sm:text-[11px]">JPG, PNG, WebP or PDF (Max 5MB)</span>
            </label>

            <div className="relative flex min-w-0 flex-col items-center justify-center rounded-field border-2 border-dashed border-accent/30 bg-canvas-raised p-4 text-center transition-all hover:border-accent hover:bg-accent/5 sm:p-6">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="pointer-events-none w-full min-w-0 space-y-1.5">
                <span className="text-2xl">📄</span>
                <p className="break-words font-sans text-sm font-semibold text-ink">
                  {file ? <span className="break-all text-accent-strong">{file.name}</span> : "Tap to browse or drag receipt here"}
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

      <div className="lilac-magic-card flex flex-col items-stretch justify-between gap-4 border border-accent/30 bg-gradient-to-r from-accent/5 via-canvas-raised to-canvas-raised p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-6">
        <div className="text-center sm:text-left">
          <span className="text-xs uppercase tracking-wider text-ink-muted font-semibold block">Total Payment Due</span>
          <div className="mt-0.5 flex flex-wrap items-baseline justify-center gap-x-2 sm:justify-start">
            <span className="font-serif text-2xl font-bold text-accent-strong sm:text-3xl">{formatLkr(total)}</span>
            <span className="text-xs text-ink-muted">({values.items.length} item{values.items.length > 1 ? "s" : ""})</span>
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
