import type { CSSProperties } from "react";

/**
 * Ambient background layer for the fairytale theme — a handful of small
 * lavender petals drifting slowly down the page (see .lilac-petal /
 * lilac-petal-fall in app/globals.css). Pure CSS animation, no JS timers, no
 * canvas/particle library. A curated, hand-picked layout rather than
 * Math.random() so a Server Component render is fully deterministic (no
 * hydration mismatch risk) and the scatter always looks intentional.
 *
 * Half the petals are hidden below `sm` so phones — most visitors here,
 * arriving via the event QR code — render fewer animated layers.
 */
const PETALS = [
  { left: "4%", size: 20, duration: 17, delay: -2, mobile: true },
  { left: "14%", size: 14, duration: 14, delay: -9, mobile: false },
  { left: "24%", size: 24, duration: 19, delay: -4, mobile: true },
  { left: "36%", size: 16, duration: 15, delay: -12, mobile: false },
  { left: "48%", size: 22, duration: 18, delay: -6, mobile: true },
  { left: "60%", size: 15, duration: 13, delay: -1, mobile: false },
  { left: "71%", size: 26, duration: 20, delay: -8, mobile: true },
  { left: "82%", size: 17, duration: 16, delay: -14, mobile: false },
  { left: "91%", size: 21, duration: 18, delay: -5, mobile: true },
  { left: "58%", size: 13, duration: 12, delay: -10, mobile: false },
] as const;

export function FloatingPetals() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none">
      {PETALS.map((p, i) => (
        <Petal key={i} {...p} tone={i % 2 === 0 ? "var(--color-accent-soft)" : "var(--color-accent-wash)"} />
      ))}
    </div>
  );
}

function Petal({
  left,
  size,
  duration,
  delay,
  mobile,
  tone,
}: (typeof PETALS)[number] & { tone: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={tone}
      className={"lilac-petal" + (mobile ? "" : " hidden sm:block")}
      style={
        {
          "--petal-left": left,
          "--petal-size": `${size}px`,
          "--petal-duration": `${duration}s`,
          "--petal-delay": `${delay}s`,
        } as CSSProperties
      }
    >
      <path d="M12 2c4 3 7 7 7 11a7 7 0 1 1-14 0c0-4 3-8 7-11Z" />
    </svg>
  );
}
