"use client";

import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { AnimatedCheck } from "@/components/ui/decor/AnimatedCheck";
import { Sparkle } from "@/components/ui/decor/Sparkle";
import { TextField } from "@/components/ui/TextField";
import { contactInputSchema } from "@/lib/validation/contact";
import { FormErrorToast } from "@/components/ui/FormErrorToast";

type FieldErrors = Partial<Record<string, string>>;

const MAX_MESSAGE_LENGTH = 500;

/** Contact form with luxury card wrapper, sparkles, and refined micro-interactions. */
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
      setFormError(Object.values(mapped)[0] ?? "Please check the form and try again.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(candidate),
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        fieldErrors?: Record<string, string[]>;
      };
      if (data.ok) setDone(true);
      else {
        const fieldErrors: FieldErrors = {};
        for (const [key, messages] of Object.entries(data.fieldErrors ?? {})) {
          if (messages?.[0]) fieldErrors[key] = messages[0];
        }
        if (Object.keys(fieldErrors).length) setErrors(fieldErrors);
        setFormError(
          Object.values(fieldErrors)[0] ?? data.error ?? "Something went wrong. Please try again.",
        );
      }
    } catch {
      setFormError("We couldn't reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-[#b79ddb]/40 bg-gradient-to-br from-white/95 via-[#f9f5ff]/90 to-[#f3ebff]/70 p-5 shadow-[0_35px_80px_-25px_rgba(110,80,160,0.3)] backdrop-blur-2xl sm:rounded-[2.5rem] sm:p-8 lg:p-12">
      <FormErrorToast message={formError} onDismiss={() => setFormError(null)} />
      {/* Ambient background glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-[#b79ddb]/25 blur-3xl motion-safe:animate-pulse"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-20 size-72 rounded-full bg-[#7b539f]/15 blur-3xl"
      />

      {/* Decorative Sparkles */}
      <Sparkle size={20} gold className="absolute right-8 top-8" delay={0.3} />
      <Sparkle size={14} className="absolute left-10 bottom-12 opacity-80" delay={0.9} />

      <div className="relative">
        {done ? (
          <div className="lailac-enter flex flex-col items-center text-center py-10 sm:py-16">
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full bg-[#7b539f]/20 blur-md" />
              <div className="relative flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-[#7b539f] to-[#9467c8] text-white shadow-lg">
                <AnimatedCheck size={40} className="shrink-0 text-white" />
              </div>
            </div>
            <h3 className="font-serif text-2xl font-bold text-ink sm:text-3xl">Message sent successfully</h3>
            <p className="mt-3 max-w-sm text-sm text-ink-muted leading-relaxed">
              Thank you for reaching out. Your note has been received and we will respond to your email shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="lailac-stagger flex flex-col gap-6">
            <div className="mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#b79ddb]/30 bg-[#7b539f]/10 px-3.5 py-1 font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7b539f] backdrop-blur shadow-sm">
                <span className="text-[#f3d98a]">❀</span> Get in touch
              </span>
              <h2 className="mt-3.5 font-serif text-3xl font-bold text-ink sm:text-4xl tracking-tight">
                Send us a note
              </h2>
              <p className="mt-2 text-sm text-ink-muted leading-relaxed">
                Have questions about the event, tickets, or special accommodations? Drop us a message below.
              </p>
            </div>

            <TextField
              label="Your name"
              required
              autoComplete="name"
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              error={errors.name}
            />

            <div className="flex flex-col gap-1">
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
              {!errors.email && (
                <p className="pl-1 text-[11px] text-ink-muted/70 font-sans">
                  We&rsquo;ll only use this to reply to your inquiry.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="contact-message"
                  className="font-sans text-sm font-medium text-ink-muted"
                >
                  Message <span className="text-[#7b539f]">*</span>
                </label>
                <span 
                  className={`font-sans text-xs transition-colors ${
                    values.message.length > MAX_MESSAGE_LENGTH ? "text-red-500 font-semibold" : "text-ink-muted/70"
                  }`}
                >
                  {values.message.length}/{MAX_MESSAGE_LENGTH}
                </span>
              </div>

              <textarea
                id="contact-message"
                required
                rows={5}
                maxLength={MAX_MESSAGE_LENGTH}
                value={values.message}
                onChange={(e) => set("message", e.target.value)}
                aria-invalid={errors.message ? true : undefined}
                aria-describedby={errors.message ? "contact-message-error" : undefined}
                className={
                  "resize-y rounded-2xl border bg-white/70 px-4 py-3 font-sans text-base text-ink transition-all duration-200 " +
                  "focus:outline-none focus:ring-2 focus:ring-[#7b539f]/30 " +
                  (errors.message
                    ? "border-red-400 focus:border-red-500 focus:ring-red-400/20 bg-red-50/10"
                    : "border-hairline hover:border-[#b79ddb]/60 focus:border-[#7b539f]")
                }
                placeholder="Write your message here..."
              />

              {errors.message && (
                <p id="contact-message-error" className="font-sans text-xs font-medium text-red-600 pl-1">
                  {errors.message}
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              loading={busy} 
              className="self-start rounded-full px-9 py-3.5 bg-gradient-to-r from-[#7b539f] to-[#9467c8] text-white font-medium shadow-[0_12px_30px_-10px_rgba(110,80,160,0.55)] hover:shadow-[0_16px_36px_-10px_rgba(110,80,160,0.75)] transition-all duration-300 hover:-translate-y-0.5"
            >
              Send message
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}