import type { CSSProperties } from "react";

/**
 * Large, slow-drifting blurred color blobs behind the page — the "aurora
 * meadow" wow-layer, sitting behind FloatingPetals and .bg-wash. Fixed +
 * transform-only animation (see .lilac-aurora-blob in app/globals.css), so
 * it's cheap even though it's visually rich. A curated layout, not
 * Math.random(), for the same deterministic-SSR reason as FloatingPetals.
 */
const BLOBS = [
  { top: "-12%", left: "-8%", size: "46vw", color: "var(--color-accent)", opacity: 0.16, duration: 24, delay: 0 },
  { top: "-6%", left: "58%", size: "40vw", color: "var(--color-blush)", opacity: 0.55, duration: 20, delay: -6 },
  { top: "62%", left: "18%", size: "44vw", color: "var(--color-accent-soft)", opacity: 0.28, duration: 26, delay: -12 },
] as const;

export function Aurora() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-20 overflow-hidden select-none">
      {BLOBS.map((b, i) => (
        <span
          key={i}
          className="lilac-aurora-blob"
          style={
            {
              top: b.top,
              left: b.left,
              width: b.size,
              height: b.size,
              backgroundColor: b.color,
              opacity: b.opacity,
              "--aurora-duration": `${b.duration}s`,
              "--aurora-delay": `${b.delay}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
