"use client";

import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Sparkle } from "@/components/ui/decor/Sparkle";
import { SelectField } from "@/components/ui/SelectField";
import { TextField } from "@/components/ui/TextField";
import {
  AGE_RANGES,
  GENDER_OPTIONS,
  SRI_LANKAN_DISTRICTS,
} from "@/lib/validation/entry";

export type EntryValues = {
  name: string;
  email: string;
  phone: string;
  address: string;
  ageRange: string;
  gender: string;
  occupation: string;
  district: string;
};

type FieldErrors = Partial<Record<string, string>>;
type SetEntryValue = <K extends keyof EntryValues>(key: K, value: string) => void;

export function EntryDetailsFields({
  values,
  errors,
  consent,
  formError,
  submitting,
  onValueChange,
  onConsentChange,
  onSubmit,
}: {
  values: EntryValues;
  errors: FieldErrors;
  consent: boolean;
  formError: string | null;
  submitting: boolean;
  onValueChange: SetEntryValue;
  onConsentChange: (consent: boolean) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className="pt-4">
      <div className="relative space-y-2 text-center">
        <Sparkle size={18} className="absolute -top-2 right-[calc(50%-5rem)]" />
        <h1 className="text-3xl text-ink">Enter the draw</h1>
        <p className="mx-auto max-w-sm font-sans text-sm leading-relaxed text-ink-muted">
          One entry per person. Your entry is counted as soon as you submit.
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="lilac-stagger mt-8 flex flex-col gap-6">
        <TextField
          label="Full name"
          required
          autoComplete="name"
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
          hint="Winners are notified at this address."
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
          value={values.phone}
          onChange={(e) => onValueChange("phone", e.target.value)}
          error={errors.phone}
        />
        <TextField
          label="Address"
          required
          autoComplete="street-address"
          value={values.address}
          onChange={(e) => onValueChange("address", e.target.value)}
          error={errors.address}
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <SelectField
            label="Age range"
            required
            placeholder="Select…"
            options={AGE_RANGES}
            value={values.ageRange}
            onChange={(e) => onValueChange("ageRange", e.target.value)}
            error={errors.ageRange}
          />
          <SelectField
            label="Gender"
            required
            placeholder="Select…"
            options={GENDER_OPTIONS}
            value={values.gender}
            onChange={(e) => onValueChange("gender", e.target.value)}
            error={errors.gender}
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <SelectField
            label="District"
            required
            placeholder="Select…"
            options={SRI_LANKAN_DISTRICTS}
            value={values.district}
            onChange={(e) => onValueChange("district", e.target.value)}
            error={errors.district}
          />
          <TextField
            label="Occupation"
            hint="Optional."
            value={values.occupation}
            onChange={(e) => onValueChange("occupation", e.target.value)}
            error={errors.occupation}
          />
        </div>

        <Checkbox
          checked={consent}
          onChange={(e) => onConsentChange(e.target.checked)}
          error={errors.consent}
        >
          I confirm the information above is accurate and I agree to the{" "}
          <a href="/terms" className="text-accent-strong underline">
            Terms
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-accent-strong underline">
            Privacy policy
          </a>
          .{" "}
          <span className="font-semibold text-ink">
            If I am selected as a winner, my full name will be published publicly
            on the Lilac results page.
          </span>
        </Checkbox>

        <div className="flex flex-col gap-4">
          {formError && (
            <p
              role="alert"
              className="rounded-field bg-red-50 px-3 py-2 font-sans text-sm text-red-700 ring-1 ring-red-200"
            >
              {formError}
            </p>
          )}

          <Button type="submit" variant="magic" loading={submitting} className="self-start">
            Submit entry
          </Button>
        </div>
      </form>
    </section>
  );
}
