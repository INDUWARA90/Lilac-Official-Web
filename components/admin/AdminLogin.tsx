"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";

/**
 * Two-step passwordless sign-in: request a code by email, then enter it.
 * (Supabase Auth email OTP under the hood — see /api/admin/login.)
 */
export function AdminLogin() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function post(body: object) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      return (await res.json()) as { ok: boolean; error?: string };
    } finally {
      setBusy(false);
    }
  }

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    const data = await post({ action: "request", email });
    if (data.ok) setStep("code");
    else setError(data.error ?? "Something went wrong.");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    const data = await post({ action: "verify", email, code });
    if (data.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      setError(data.error ?? "That code is not valid.");
    }
  }

  return (
    <div className="mx-auto mt-24 w-full max-w-sm px-6">
      <h1 className="text-2xl text-ink">Admin sign in</h1>

      {step === "email" ? (
        <form onSubmit={requestCode} className="mt-6 flex flex-col gap-4">
          <TextField
            label="Email address"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p className="font-sans text-xs text-ink-muted">
            We&rsquo;ll email a 6-digit sign-in code to the admin address.
          </p>
          {error && <p className="font-sans text-sm text-red-600">{error}</p>}
          <Button type="submit" loading={busy} className="self-start">
            Send code
          </Button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="mt-6 flex flex-col gap-4">
          <TextField
            label="6-digit code"
            inputMode="numeric"
            required
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            hint={`Sent to ${email}.`}
          />
          {error && <p className="font-sans text-sm text-red-600">{error}</p>}
          <div className="flex items-center gap-3">
            <Button type="submit" loading={busy}>
              Sign in
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setStep("email");
                setCode("");
                setError(null);
              }}
            >
              Use a different email
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
