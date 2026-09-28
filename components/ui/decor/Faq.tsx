"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useId, useState } from "react";

export type FaqItem = { q: string; a: string };

/**
 * Accordion — one answer open at a time, height + fade animated. Buttons are
 * real <button aria-expanded>, so it's keyboard and screen-reader friendly.
 */
export function Faq({ items }: { items: readonly FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const reduce = useReducedMotion();
  const base = useId();

  return (
    <div className="lilac-magic-card divide-y divide-hairline overflow-hidden">
      {items.map((item, i) => {
        const isOpen = open === i;
        const panelId = `${base}-panel-${i}`;
        return (
          <div key={item.q}>
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-sans text-sm font-medium text-ink transition-colors hover:bg-accent-wash/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
            >
              {item.q}
              <motion.svg
                aria-hidden
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="shrink-0 text-accent-strong"
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: reduce ? 0 : 0.25 }}
              >
                <path
                  d="M3 6l5 5 5-5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </motion.svg>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  initial={reduce ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={{ duration: reduce ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-4 font-sans text-sm leading-relaxed text-ink-muted">
                    {item.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
