"use client";

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function SuccessCelebration({ firstName }: { firstName: string }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
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
  }, []);

  return (
    <section className="flex flex-col items-center gap-6 pt-8 text-center">
      <div className="space-y-3">
        <h1 className="text-3xl text-ink">You&rsquo;re in the draw</h1>
        <p className="mx-auto max-w-sm font-sans text-sm leading-relaxed text-ink-muted">
          Thank you, {firstName}. Your entry is confirmed. Winners are selected
          after entries close and are notified by email.
        </p>
      </div>

      <Link href="/results">
        <Button variant="ghost">View the results page</Button>
      </Link>
    </section>
  );
}
