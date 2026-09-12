"use client";

import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { contactInputSchema } from "@/lib/validation/contact";

type FieldErrors = Partial<Record<string, string>>;

/** Contact form. Same validate-twice pattern as the entry form. */
export function ContactForm() {
  const [values, setValues] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  function set(key: keyof typeof values, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const candidate = { ...values };
    const parsed = contactInputSchema.safeParse(candidate);
    if (!parsed.success) {
      const flat = z.flattenError(parsed.error).fieldErrors;
      const mapped: FieldErrors = {};
      for (const [k, v] of Object.entries(flat)) if (v?.length) mapped[k] = v[0];
      setErrors(mapped);
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(candidate),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) setDone(true);
      else setFormError(data.error ?? "Something went wrong. Please try again.");
    } catch {
      setFormError("We couldn't reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <p className="rounded-card bg-canvas-raised px-4 py-3 font-sans text-sm text-ink ring-1 ring-hairline">
        Thank you. Your message has been sent and we will respond by email.
      </p>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      
      <TextField
        label="Your name"
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
        value={values.email}
        onChange={(e) => set("email", e.target.value)}
        error={errors.email}
      />

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="contact-message"
          className="font-sans text-sm font-medium text-ink-muted"
        >
          Message <span className="text-accent-strong">*</span>
        </label>

        <textarea
          id="contact-message"
          required
          rows={5}
          value={values.message}
          onChange={(e) => set("message", e.target.value)}
          aria-invalid={errors.message ? true : undefined}
          className={
            "resize-y rounded-field border bg-transparent px-3 py-2 font-sans text-base text-ink " +
            "focus:outline-none focus:ring-0 " +
            (errors.message
              ? "border-red-400 focus:border-red-500"
              : "border-hairline focus:border-accent")
          }
        />
        {errors.message && (
          <p className="font-sans text-xs text-red-600">{errors.message}</p>
        )}
      </div>

      {formError && (
        <p
          role="alert"
          className="rounded-field bg-red-50 px-3 py-2 font-sans text-sm text-red-700 ring-1 ring-red-200"
        >
          {formError}
        </p>
      )}

      <Button type="submit" loading={busy} className="self-start">
        Send message
      </Button>
    </form>
  );
}
