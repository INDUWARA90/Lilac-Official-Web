"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import confetti from "canvas-confetti";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Sparkle } from "@/components/ui/decor/Sparkle";
import { AnimatedCheck } from "@/components/ui/decor/AnimatedCheck";

export function SuccessCelebration({ firstName }: { firstName: string }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const end = Date.now() + 900;
    // Lavender + gold, on-theme with the fairytale palette.
    const colors = ["#5a45d6", "#c9b8f0", "#e3b04b", "#ffffff"];
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
      <AnimatedCheck size={64} />
      <div className="relative space-y-3">
        <span aria-hidden className="lilac-ring" />
        <span aria-hidden className="lilac-ring" style={{ "--ring-delay": "0.6s" } as CSSProperties} />
        <span aria-hidden className="lilac-ring" style={{ "--ring-delay": "1.2s" } as CSSProperties} />
        <Sparkle size={20} className="absolute -top-3 left-[calc(50%-6rem)]" gold delay={0.3} />
        <Sparkle size={14} className="absolute -top-1 right-[calc(50%-6.5rem)]" delay={1.1} />
        <h1 className="lilac-gradient-text text-4xl">You&rsquo;re in the draw</h1>
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
