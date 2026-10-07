"use client";

import { useMemo, useState } from "react";
import { z } from "zod";
import { createAnonClient } from "@/lib/supabase/client";
import { tshirtOrderSchema } from "@/lib/validation/tshirt";
import { TshirtOrderSuccess } from "@/components/tshirts/TshirtOrderSuccess";
import { TshirtOrderFields, type TshirtOrderValues } from "@/components/tshirts/TshirtOrderFields";
import { ALLOWED_RECEIPT_TYPES, MAX_RECEIPT_BYTES } from "@/lib/tshirts-shared";

type Errors = Partial<Record<string, string>>;

export function TshirtOrderForm({ priceLkr }: { priceLkr: number }) {
  const [values, setValues] = useState<TshirtOrderValues>({
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
      const details = tshirtOrderSchema.omit({ receiptPath: true }).safeParse(values);
      if (!details.success) {
        const out: Errors = {};
        for (const [k, v] of Object.entries(z.flattenError(details.error).fieldErrors)) {
          if (v?.[0]) out[k] = v[0];
        }
        setErrors(out);
        return;
      }

      const uploaded = await upload();
      if ("error" in uploaded) {
        setErrors({ receiptPath: uploaded.error });
        return;
      }
      const parsed = tshirtOrderSchema.safeParse({ ...details.data, receiptPath: uploaded.path });
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
        body: JSON.stringify(parsed.data),
      });
      const data = (await res.json()) as { ok: boolean; reference?: string; error?: string; fieldErrors?: Record<string, string[]> };
      if (res.ok && data.ok && data.reference) {
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

  if (reference) {
    return <TshirtOrderSuccess reference={reference} email={values.email} />;
  }

  return (
    <TshirtOrderFields
      values={values}
      errors={errors}
      file={file}
      busy={busy}
      formError={formError}
      total={total}
      onValueChange={set}
      onFileChange={(selectedFile) => {
        setFile(selectedFile);
        setErrors((current) => ({ ...current, receiptPath: undefined }));
      }}
      onSubmit={submit}
    />
  );
}