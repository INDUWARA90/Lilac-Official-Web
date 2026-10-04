"use client";

import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { SelectField } from "@/components/ui/SelectField";
import { Sparkle } from "@/components/ui/decor/Sparkle";
import { TSHIRT_SIZES } from "@/lib/tshirts-shared";
import { formatLkr } from "@/lib/tickets-shared";

export type TshirtOrderValues = {
  name: string;
  registrationNumber: string;
  faculty: string;
  email: string;
  phone: string;
  size: string;
  quantity: string;
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
  onValueChange,
  onFileChange,
  onSubmit,
}: {
  values: TshirtOrderValues;
  errors: Errors;
  file: File | null;
  busy: boolean;
  formError: string | null;
  total: number;
  onValueChange: SetOrderValue;
  onFileChange: (file: File | null) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSubmit} noValidate className="lilac-stagger flex flex-col gap-8">
      <div className="lilac-magic-card p-5 relative overflow-hidden bg-gradient-to-r from-canvas-raised via-canvas-raised to-accent/5 border border-accent/25">
        <Sparkle size={16} gold className="absolute top-4 right-5" />
        <h3 className="font-serif text-base font-semibold text-ink flex items-center gap-2 mb-1.5">
          <span>🛍️</span> T-Shirt Pre-Order Instructions
        </h3>
        <p className="font-sans text-xs sm:text-sm text-ink-muted leading-relaxed">
          Complete the bank payment first, upload your transfer receipt slip below, and select your correct faculty from the dropdown for manual verification.
        </p>
      </div>

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
              onChange={(e) => onValueChange("size", e.target.value)}
              error={errors.size}
            />
            <SelectField
              label="Quantity"
              required
              options={["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]}
              value={values.quantity}
              onChange={(e) => onValueChange("quantity", e.target.value)}
              error={errors.quantity}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-sm font-medium text-ink flex items-center justify-between">
              <span>Payment receipt slip <span className="text-accent-strong">*</span></span>
              <span className="text-[11px] text-ink-muted">JPG, PNG, WebP or PDF (Max 5MB)</span>
            </label>

            <div className="relative flex flex-col items-center justify-center rounded-field border-2 border-dashed border-accent/30 bg-canvas-raised p-6 text-center hover:border-accent hover:bg-accent/5 transition-all cursor-pointer">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
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
