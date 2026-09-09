"use client";

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

/**
 * The one big celebratory moment on the site (brief motion spec) — fired once
 * when an entry is confirmed. Respects prefers-reduced-motion.
 */
export function SuccessCelebration({
  firstName,
  ticketCode,
  alreadyVerified,
}: {
  firstName: string;
  ticketCode: string;
  alreadyVerified: boolean;
}) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current || alreadyVerified) return;
    fired.current = true;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const end = Date.now() + 900;
    const colors = ["#5a45d6", "#f1eefc", "#45329f", "#ffffff"];
    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, [alreadyVerified]);

  return (
    <section className="flex flex-col items-center gap-6 pt-8 text-center">
      <div className="space-y-3">
        <h1 className="text-3xl text-ink">
          {alreadyVerified
            ? "Your entry is already confirmed"
            : "Your entry has been confirmed"}
        </h1>
        <p className="mx-auto max-w-sm font-sans text-sm leading-relaxed text-ink-muted">
          Thank you, {firstName}. You are now entered into the Lilac draw. Winners
          are selected after entries close and are notified by email.
        </p>
      </div>

      <div className="w-full rounded-card bg-canvas-raised px-6 py-5 ring-1 ring-hairline">
        <p className="font-sans text-xs uppercase tracking-wider text-ink-muted">
          Your ticket code
        </p>
        <p className="mt-1 font-serif text-2xl font-semibold tracking-wider text-accent-strong">
          {ticketCode}
        </p>
      </div>

      <Link href="/results">
        <Button variant="ghost">View the results page</Button>
      </Link>
    </section>
  );
}
