"use client";

import { useMemo, useState } from "react";
import { z } from "zod";
import { createAnonClient } from "@/lib/supabase/client";
import { tshirtOrderSchema } from "@/lib/validation/tshirt";
import { TshirtOrderSuccess } from "@/components/tshirts/TshirtOrderSuccess";
import { TshirtOrderFields, type TshirtOrderValues } from "@/components/tshirts/TshirtOrderFields";
import { FormErrorToast } from "@/components/ui/FormErrorToast";
import { ALLOWED_RECEIPT_TYPES, MAX_RECEIPT_BYTES } from "@/lib/tshirts-shared";
import type { TicketBank } from "@/components/tickets/ticket-purchase-types";

type Errors = Partial<Record<string, string>>;

function errorsFrom(error: z.ZodError): Errors {
  const errors: Errors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

export function TshirtOrderForm({
  priceLkr,
  bank,
}: {
  priceLkr: number;
  bank: TicketBank;
}) {
  const [values, setValues] = useState<TshirtOrderValues>({
    name: "",
    registrationNumber: "",
    faculty: "",
    email: "",
    phone: "",
    items: [{ size: "", color: "" }],
  });
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  const total = useMemo(() => priceLkr * values.items.length, [priceLkr, values.items.length]);

  function set(key: keyof typeof values, value: string) {
    if (key === "items") {
      setValues((v) => {
        const quantity = Number(value);
        const items = [...v.items];
        while (items.length < quantity) items.push({ size: "", color: "" });
        return { ...v, items: items.slice(0, quantity) };
      });
      setErrors((current) => Object.fromEntries(
        Object.entries(current).filter(([errorKey]) => !errorKey.startsWith("items")),
      ));
    } else {
      setValues((v) => ({ ...v, [key]: value }));
      setErrors((current) => ({ ...current, [key]: undefined }));
    }
  }

  function setItem(index: number, key: "size" | "color", value: string) {
    setValues((v) => ({
      ...v,
      items: v.items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item),
    }));
    setErrors((current) => ({ ...current, [`items.${index}.${key}`]: undefined, items: undefined }));
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
        const fieldErrors = errorsFrom(details.error);
        setErrors(fieldErrors);
        setFormError(Object.values(fieldErrors)[0] ?? "Please check the form and try again.");
        return;
      }

      const uploaded = await upload();
      if ("error" in uploaded) {
        setErrors({ receiptPath: uploaded.error });
        setFormError(uploaded.error ?? "The receipt upload failed. Please try again.");
        return;
      }
      const parsed = tshirtOrderSchema.safeParse({ ...details.data, receiptPath: uploaded.path });
      if (!parsed.success) {
        const fieldErrors = errorsFrom(parsed.error);
        setErrors(fieldErrors);
        setFormError(Object.values(fieldErrors)[0] ?? "Please check the form and try again.");
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
        setFormError(
          Object.values(out)[0] ?? data.error ?? "Something went wrong. Please try again.",
        );
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
    <>
      <FormErrorToast message={formError} onDismiss={() => setFormError(null)} />
      <TshirtOrderFields
        values={values}
        errors={errors}
        file={file}
        busy={busy}
        total={total}
        bank={bank}
        onValueChange={set}
        onItemChange={setItem}
        onFileChange={(selectedFile) => {
          setFile(selectedFile);
          setErrors((current) => ({ ...current, receiptPath: undefined }));
        }}
        onSubmit={submit}
      />
    </>
  );
}