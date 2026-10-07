"use client";

import confetti from "canvas-confetti";
import { useEffect } from "react";

/**
 * One soft confetti burst the first time a visitor sees the winners on
 * /results in a browser session — renders nothing. Skipped under
 * `prefers-reduced-motion`.
 */
export function WinnersConfetti() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    try {
      if (sessionStorage.getItem("lailac_winners_confetti")) return;
      sessionStorage.setItem("lailac_winners_confetti", "1");
    } catch {
      // sessionStorage unavailable — fine, just fire once per mount.
    }
    const colors = ["#5a45d6", "#c9b8f0", "#e3b04b", "#ffffff"];
    confetti({ particleCount: 70, spread: 80, origin: { y: 0.35 }, colors, scalar: 0.9 });
    const t = setTimeout(
      () =>
        confetti({ particleCount: 40, spread: 100, origin: { x: 0.2, y: 0.4 }, colors, scalar: 0.8 }),
      250,
    );
    return () => clearTimeout(t);
  }, []);

  return null;
}
