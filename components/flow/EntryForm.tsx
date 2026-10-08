"use client";

import { useEffect, useState } from "react";
import { EntryDetailsFields, type EntryValues } from "@/components/flow/EntryDetailsFields";
import { FormErrorToast } from "@/components/ui/FormErrorToast";
import { entryInputSchema } from "@/lib/validation/entry";
import { z } from "zod";

type FieldErrors = Partial<Record<string, string>>;

const EMPTY: EntryValues = {
  name: "",
  email: "",
  phone: "",
  address: "",
  ageRange: "",
  gender: "",
  occupation: "",
  district: "",
};

const DRAFT_KEY = "lailac-entry-draft";
const DRAFT_MAX_AGE_MS = 30 * 60 * 1000; // ignore a draft older than this

/**
 * A refresh mid-form (flaky mobile signal, lock screen, accidental back)
 * shouldn't force retyping everything from scratch. The ad-watch requirement
 * still resets on a refresh — that's intentional, see AdsStep — but the typed
 * fields don't have to. Kept in sessionStorage (this tab only, gone when it
 * closes) and capped at 30 minutes so a shared/kiosk device won't prefill a
 * stranger's stale details.
 */
function loadDraft(): { values: typeof EMPTY; consent: boolean } | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { values?: Partial<typeof EMPTY>; consent?: boolean; savedAt?: number };
    if (typeof parsed.savedAt !== "number" || Date.now() - parsed.savedAt > DRAFT_MAX_AGE_MS) {
      return null;
    }
    return { values: { ...EMPTY, ...parsed.values }, consent: Boolean(parsed.consent) };
  } catch {
    return null;
  }
}

function saveDraft(values: typeof EMPTY, consent: boolean) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ values, consent, savedAt: Date.now() }));
  } catch {
    // sessionStorage unavailable (private mode, quota) — the form still works,
    // just without refresh-resilience.
  }
}

function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}

/**
 * Step 2 — the entry form.
 *
 * Validation happens twice: here with the SAME zod schema the server uses (fast
 * inline feedback), and authoritatively in /api/entry. Server field errors are
 * merged back into the inline error map.
 */
export function EntryForm({
  adSession,
  onSubmitted,
}: {
  adSession: string;
  onSubmitted: (result: { firstName: string }) => void;
}) {
  const [values, setValues] = useState(() => loadDraft()?.values ?? EMPTY);
  const [consent, setConsent] = useState(() => loadDraft()?.consent ?? false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Persist on every change so a refresh can restore it (see loadDraft above).
  useEffect(() => {
    saveDraft(values, consent);
  }, [values, consent]);

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
      adSession,
    };

    // Client-side pass with the shared schema.
    const parsed = entryInputSchema.safeParse(candidate);
    if (!parsed.success) {
      const flat = z.flattenError(parsed.error).fieldErrors;
      const fieldErrors = mapFirst(flat);
      setErrors(fieldErrors);
      setFormError(Object.values(fieldErrors)[0] ?? "Please check the form and try again.");
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
        clearDraft();
        onSubmitted({
          firstName: data.firstName ?? parsed.data.name.split(" ")[0] ?? "there",
        });
        return;
      }
      const fieldErrors = data.fieldErrors ? mapFirst(data.fieldErrors) : {};
      if (data.fieldErrors) setErrors(fieldErrors);
      setFormError(
        Object.values(fieldErrors)[0] ?? data.error ?? "Something went wrong. Please try again.",
      );
    } catch {
      setFormError("We couldn't reach the server. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <FormErrorToast message={formError} onDismiss={() => setFormError(null)} />
      <EntryDetailsFields
        values={values}
        errors={errors}
        consent={consent}
        submitting={submitting}
        onValueChange={set}
        onConsentChange={(checked) => {
          setConsent(checked);
          if (errors.consent) setErrors((current) => ({ ...current, consent: undefined }));
        }}
        onSubmit={handleSubmit}
      />
    </>
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
