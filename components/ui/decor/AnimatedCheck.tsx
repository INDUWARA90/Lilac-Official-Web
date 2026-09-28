"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * A circle that draws itself, then a tick — used on success screens. Under
 * `prefers-reduced-motion` it just renders fully drawn.
 */
export function AnimatedCheck({
  size = 56,
  className = "text-accent",
}: {
  size?: number;
  /** Tailwind classes; set a `text-*` color here (the drawing uses currentColor). */
  className?: string;
}) {
  const reduce = useReducedMotion();
  const draw = (delay: number, duration: number) =>
    reduce
      ? { initial: false as const }
      : {
          initial: { pathLength: 0, opacity: 0 },
          animate: { pathLength: 1, opacity: 1 },
          transition: { delay, duration, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      aria-hidden
      className={className}
    >
      <motion.circle
        cx="28"
        cy="28"
        r="25"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        {...draw(0, 0.7)}
      />
      <motion.path
        d="M17 29l8 8 14-16"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...draw(0.55, 0.45)}
      />
    </svg>
  );
}
