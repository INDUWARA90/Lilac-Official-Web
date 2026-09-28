"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * A heading with a wavy underline that draws itself in when scrolled into
 * view. The line spans the heading's own width.
 */
export function SectionTitle({
  children,
  className = "",
}: {
  children: ReactNode;
  /** Classes for the <h2> itself (size, color). */
  className?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <div className="inline-block max-w-full">
      <h2 className={className}>{children}</h2>
      <svg
        aria-hidden
        width="100%"
        height="8"
        viewBox="0 0 100 8"
        preserveAspectRatio="none"
        fill="none"
        className="mt-1 block text-accent-soft"
      >
        <motion.path
          d="M1 4 Q 9 0 17 4 T 33 4 T 49 4 T 65 4 T 81 4 T 99 4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          initial={reduce ? false : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: 1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
    </div>
  );
}
