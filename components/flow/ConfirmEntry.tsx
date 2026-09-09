"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { SuccessCelebration } from "@/components/flow/SuccessCelebration";

/**
 * Rendered on /verify. Shows a single "Confirm my entry" button that POSTs the
 * token to /api/verify (see that route for why confirmation is a POST, not a
 * bare GET on the emailed link). On success, swaps in the celebration screen.
 */
type Result = {
  firstName: string;
  ticketCode: string;
  alreadyVerified: boolean;
};

export function ConfirmEntry({ token }: { token: string }) {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function confirm() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        firstName?: string;
        ticketCode?: string;
        alreadyVerified?: boolean;
      };
      if (res.ok && data.ok) {
        setResult({
          firstName: data.firstName ?? "there",
          ticketCode: data.ticketCode ?? "",
          alreadyVerified: Boolean(data.alreadyVerified),
        });
        return;
      }
      setError(data.error ?? "This confirmation link is not valid.");
    } catch {
      setError("We couldn't reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-10 py-4">
      <StepIndicator current="Confirm" />

      {result ? (
        <SuccessCelebration
          firstName={result.firstName}
          ticketCode={result.ticketCode}
          alreadyVerified={result.alreadyVerified}
        />
      ) : (
        <section className="flex flex-col items-center gap-6 pt-4 text-center">
          <div className="space-y-3">
            <h1 className="text-3xl text-ink">Confirm your entry</h1>
            <p className="mx-auto max-w-sm font-sans text-sm leading-relaxed text-ink-muted">
              Select the button below to finalise your entry into the Lilac draw.
            </p>
          </div>

          {error ? (
            <>
              <p
                role="alert"
                className="rounded-field bg-red-50 px-3 py-2 font-sans text-sm text-red-700 ring-1 ring-red-200"
              >
                {error}
              </p>
              <Link href="/">
                <Button variant="ghost">Return to the entry form</Button>
              </Link>
            </>
          ) : (
            <Button onClick={confirm} loading={submitting}>
              Confirm my entry
            </Button>
          )}
        </section>
      )}
    </div>
  );
}
