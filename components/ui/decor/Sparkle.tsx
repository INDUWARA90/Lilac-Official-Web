import type { CSSProperties } from "react";

/**
 * A small twinkling accent (see .lailac-sparkle in app/globals.css). Used
 * sparingly near headings/CTAs/winner names — not a repeating background
 * pattern, just a few placed touches.
 */
export function Sparkle({
  className = "",
  size = 16,
  delay = 0,
  duration = 2.6,
  gold = false,
}: {
  className?: string;
  size?: number;
  /** Stagger multiple sparkles so they don't all twinkle in lockstep. */
  delay?: number;
  duration?: number;
  /** Gold tone for the ticket flow; lavender (default) elsewhere. */
  gold?: boolean;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={gold ? "var(--color-magic-gold)" : "var(--color-accent-soft)"}
      className={`lailac-sparkle ${className}`}
      style={
        {
          "--sparkle-delay": `${delay}s`,
          "--sparkle-duration": `${duration}s`,
        } as CSSProperties
      }
    >
      <path d="M12 2c.6 4.2 2 6.9 6.5 8-4.5 1.1-5.9 3.8-6.5 8-.6-4.2-2-6.9-6.5-8 4.5-1.1 5.9-3.8 6.5-8Z" />
    </svg>
  );
}
