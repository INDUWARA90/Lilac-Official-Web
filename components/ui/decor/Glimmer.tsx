import type { CSSProperties } from "react";

/**
 * Tiny twinkling fairy-dust points, denser than FloatingPetals and a
 * different texture (small twinkling dots vs. larger drifting shapes) — the
 * two layer together for depth. Curated layout, same deterministic-SSR
 * reasoning as FloatingPetals/Aurora. Roughly a third are hidden below `sm`.
 */
const DOTS = [
  { top: "8%", left: "10%", size: 3, duration: 2.8, delay: 0, gold: false, mobile: true },
  { top: "18%", left: "88%", size: 4, duration: 3.4, delay: 0.6, gold: true, mobile: true },
  { top: "30%", left: "22%", size: 2, duration: 2.4, delay: 1.2, gold: false, mobile: false },
  { top: "12%", left: "55%", size: 3, duration: 3.8, delay: 0.3, gold: false, mobile: true },
  { top: "45%", left: "6%", size: 4, duration: 3.1, delay: 1.6, gold: true, mobile: false },
  { top: "55%", left: "92%", size: 3, duration: 2.9, delay: 0.9, gold: false, mobile: true },
  { top: "68%", left: "35%", size: 2, duration: 3.6, delay: 0.2, gold: false, mobile: false },
  { top: "78%", left: "72%", size: 3, duration: 2.6, delay: 1.4, gold: true, mobile: true },
  { top: "88%", left: "15%", size: 3, duration: 3.3, delay: 0.7, gold: false, mobile: false },
  { top: "5%", left: "35%", size: 2, duration: 2.7, delay: 1.9, gold: false, mobile: false },
  { top: "40%", left: "70%", size: 3, duration: 3.9, delay: 0.4, gold: false, mobile: true },
  { top: "92%", left: "50%", size: 2, duration: 2.5, delay: 1.1, gold: true, mobile: false },
] as const;

export function Glimmer() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none">
      {DOTS.map((d, i) => (
        <span
          key={i}
          className={"lilac-glimmer" + (d.mobile ? "" : " hidden sm:block")}
          style={
            {
              top: d.top,
              left: d.left,
              width: `${d.size}px`,
              height: `${d.size}px`,
              "--glimmer-duration": `${d.duration}s`,
              "--glimmer-delay": `${d.delay}s`,
              "--glimmer-color": d.gold ? "var(--color-magic-gold)" : "var(--color-accent-soft)",
              "--glimmer-peak": d.gold ? 0.8 : 0.9,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
