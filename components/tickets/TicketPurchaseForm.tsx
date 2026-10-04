"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { createAnonClient } from "@/lib/supabase/client";
import { ticketPurchaseSchema } from "@/lib/validation/ticket";
import { TicketPaymentGuide } from "@/components/tickets/TicketPaymentGuide";
import { TicketPurchaseDetails } from "@/components/tickets/TicketPurchaseDetails";
import { TicketPurchaseSuccess } from "@/components/tickets/TicketPurchaseSuccess";
import {
  ALLOWED_SLIP_TYPES,
  MAX_SLIP_BYTES,
} from "@/lib/tickets-shared";
import type {
  TicketBank,
  TicketFieldErrors,
  TicketPurchaseValues,
} from "@/components/tickets/ticket-purchase-types";

export function TicketPurchaseForm({
  seatingPriceLkr,
  standingPriceLkr,
  seatingLeft,
  standingLeft,
  bank,
}: {
  seatingPriceLkr: number;
  standingPriceLkr: number;
  seatingLeft: number;
  standingLeft: number;
  bank: TicketBank;
}) {
  const [values, setValues] = useState<TicketPurchaseValues>({
    name: "",
    email: "",
    phone: "",
    ticketType: seatingLeft > 0 ? "seating" : "standing",
    quantity: "1",
  });
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<TicketFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ reference: string } | null>(null);

  // Generate a temporary object URL for image previews of the slip
  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function set<K extends keyof TicketPurchaseValues>(key: K, value: TicketPurchaseValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function uploadSlip(): Promise<{ path: string } | { error: string }> {
    if (!file) return { error: "Attach a photo or PDF of your bank transfer slip." };
    if (!ALLOWED_SLIP_TYPES.includes(file.type as (typeof ALLOWED_SLIP_TYPES)[number])) {
      return { error: "Use a JPG, PNG, WebP or PDF." };
    }
    if (file.size > MAX_SLIP_BYTES) {
      return { error: `That file is over ${Math.round(MAX_SLIP_BYTES / (1024 * 1024))} MB.` };
    }
    const urlRes = await fetch("/api/tickets/upload-url", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ filename: file.name, size: file.size, contentType: file.type }),
    });
    const urlData = (await urlRes.json()) as {
      ok: boolean;
      error?: string;
      bucket?: string;
      path?: string;
      token?: string;
    };
    if (!urlData.ok || !urlData.path || !urlData.token || !urlData.bucket) {
      return { error: urlData.error ?? "Could not start the upload." };
    }
    const { error } = await createAnonClient()
      .storage.from(urlData.bucket)
      .uploadToSignedUrl(urlData.path, urlData.token, file, { contentType: file.type });
    if (error) return { error: "The upload failed. Please try again." };
    return { path: urlData.path };
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setBusy(true);
    try {
      const uploaded = await uploadSlip();
      if ("error" in uploaded) {
        setErrors((x) => ({ ...x, slipPath: uploaded.error }));
        setBusy(false);
        return;
      }

      const candidate = { ...values, slipPath: uploaded.path };
      const parsed = ticketPurchaseSchema.safeParse(candidate);
      if (!parsed.success) {
        const flat = z.flattenError(parsed.error).fieldErrors;
        const mapped: TicketFieldErrors = {};
        for (const [k, v] of Object.entries(flat)) if (v?.length) mapped[k] = v[0];
        setErrors(mapped);
        setBusy(false);
        return;
      }

      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(candidate),
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        fieldErrors?: Record<string, string[]>;
        reference?: string;
      };
      if (res.ok && data.ok && data.reference) {
        setDone({ reference: data.reference });
        return;
      }
      if (data.fieldErrors) {
        const mapped: TicketFieldErrors = {};
        for (const [k, v] of Object.entries(data.fieldErrors)) if (v?.length) mapped[k] = v[0];
        setErrors(mapped);
      }
      setFormError(data.error ?? "Something went wrong. Please try again.");
    } catch {
      setFormError("We couldn't reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return <TicketPurchaseSuccess reference={done.reference} email={values.email} quantity={values.quantity} />;
  }

  return (
    <form onSubmit={submit} noValidate className="lilac-stagger flex flex-col gap-6">
      <TicketPaymentGuide
        seatingPriceLkr={seatingPriceLkr}
        standingPriceLkr={standingPriceLkr}
        bank={bank}
      />
      <TicketPurchaseDetails
        values={values}
        seatingPriceLkr={seatingPriceLkr}
        standingPriceLkr={standingPriceLkr}
        seatingLeft={seatingLeft}
        standingLeft={standingLeft}
        errors={errors}
        file={file}
        previewUrl={previewUrl}
        busy={busy}
        formError={formError}
        onValueChange={set}
        onFileChange={(selectedFile) => {
          setFile(selectedFile);
          if (errors.slipPath) setErrors((current) => ({ ...current, slipPath: undefined }));
        }}
      />
    </form>
  );
}