"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { SelectField } from "@/components/ui/SelectField";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  AGE_RANGES,
  GENDER_OPTIONS,
  SRI_LANKAN_DISTRICTS,
  entryInputSchema,
} from "@/lib/validation/entry";
import { z } from "zod";

type FieldErrors = Partial<Record<string, string>>;

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  address: "",
  ageRange: "",
  gender: "",
  occupation: "",
  district: "",
};

/**
 * Step 2 — the entry form.
 *
 * Validation happens twice: here with the SAME zod schema the server uses (fast
 * inline feedback), and authoritatively in /api/entry. Server field errors are
 * merged back into the inline error map.
 */
export function EntryForm({
  adWatchedAt,
  onSubmitted,
}: {
  adWatchedAt: string | null;
  onSubmitted: (result: { firstName: string }) => void;
}) {
  const [values, setValues] = useState(EMPTY);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof typeof EMPTY>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const candidate = {
      ...values,
      occupation: values.occupation || undefined,
      consent,
      adWatchedAt: adWatchedAt ?? undefined,
    };

    // Client-side pass with the shared schema.
    const parsed = entryInputSchema.safeParse(candidate);
    if (!parsed.success) {
      const flat = z.flattenError(parsed.error).fieldErrors;
      setErrors(mapFirst(flat));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/entry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(candidate),
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        fieldErrors?: Record<string, string[]>;
        firstName?: string;
      };

      if (res.ok && data.ok) {
        onSubmitted({
          firstName: data.firstName ?? parsed.data.name.split(" ")[0] ?? "there",
        });
        return;
      }
      if (data.fieldErrors) setErrors(mapFirst(data.fieldErrors));
      setFormError(data.error ?? "Something went wrong. Please try again.");
    } catch {
      setFormError("We couldn't reach the server. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="pt-4">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl text-ink">Enter the draw</h1>
        <p className="mx-auto max-w-sm font-sans text-sm leading-relaxed text-ink-muted">
          One entry per person. Your entry is counted as soon as you submit.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-6">
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
          hint="Your confirmation link is sent here."
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
        <TextField
          label="Address"
          required
          autoComplete="street-address"
          value={values.address}
          onChange={(e) => set("address", e.target.value)}
          error={errors.address}
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <SelectField
            label="Age range"
            required
            placeholder="Select…"
            options={AGE_RANGES}
            value={values.ageRange}
            onChange={(e) => set("ageRange", e.target.value)}
            error={errors.ageRange}
          />
          <SelectField
            label="Gender"
            required
            placeholder="Select…"
            options={GENDER_OPTIONS}
            value={values.gender}
            onChange={(e) => set("gender", e.target.value)}
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
            onChange={(e) => set("district", e.target.value)}
            error={errors.district}
          />
          <TextField
            label="Occupation"
            hint="Optional."
            value={values.occupation}
            onChange={(e) => set("occupation", e.target.value)}
            error={errors.occupation}
          />
        </div>

        <Checkbox
          checked={consent}
          onChange={(e) => {
            setConsent(e.target.checked);
            if (errors.consent) setErrors((er) => ({ ...er, consent: undefined }));
          }}
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

          <Button type="submit" loading={submitting} className="self-start">
            Submit entry
          </Button>
        </div>
      </form>
    </section>
  );
}

/** Take the first message from each field's error array. */
function mapFirst(flat: Record<string, string[] | undefined>): FieldErrors {
  const out: FieldErrors = {};
  for (const [key, msgs] of Object.entries(flat)) {
    if (msgs && msgs.length) out[key] = msgs[0];
  }
  return out;
}
