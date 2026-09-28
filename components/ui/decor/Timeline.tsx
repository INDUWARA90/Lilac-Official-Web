"use client";

import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Numbered vertical steps joined by a line that draws itself down as the list
 * scrolls into view; each step slides in after the one before it.
 */
export function Timeline({ steps }: { steps: readonly string[] }) {
  const reduce = useReducedMotion();

  return (
    <ol className="relative mt-4 space-y-5 pl-10">
      <motion.span
        aria-hidden
        className="absolute top-3 bottom-3 left-[15px] w-px origin-top bg-gradient-to-b from-accent to-accent-soft"
        initial={reduce ? false : { scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 1.3, ease: EASE }}
      />
      {steps.map((step, i) => (
        <motion.li
          key={step}
          className="relative font-sans text-sm leading-relaxed text-ink-muted"
          initial={reduce ? false : { opacity: 0, x: -18 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ delay: i * 0.12, duration: 0.55, ease: EASE }}
        >
          <motion.span
            aria-hidden
            className="absolute top-0 -left-10 flex size-8 items-center justify-center rounded-pill bg-accent text-xs font-semibold text-white ring-4 ring-white/80"
            initial={reduce ? false : { scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ delay: i * 0.12 + 0.1, type: "spring", stiffness: 380, damping: 18 }}
          >
            {i + 1}
          </motion.span>
          <span className="block pt-1.5">{step}</span>
        </motion.li>
      ))}
    </ol>
  );
}
