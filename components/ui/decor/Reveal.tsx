"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Fades/rises children in once they scroll into view — a thin framer-motion
 * wrapper around `whileInView` (which handles the IntersectionObserver
 * itself). `useReducedMotion()` disables the animation and shows content
 * immediately, matching the CSS-based motion elsewhere in the theme.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  /** Stagger multiple <Reveal>s on the same page, in ms. */
  delay?: number;
  className?: string;
  /** Render as a different element — e.g. "li" inside a <ul>. */
  as?: "div" | "li";
}) {
  const reduce = useReducedMotion();
  const MotionTag = as === "li" ? motion.li : motion.div;

  return (
    <MotionTag
      className={className}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, delay: delay / 1000, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionTag>
  );
}
