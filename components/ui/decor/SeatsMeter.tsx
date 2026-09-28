"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * "X of Y seats left" progress bar. Fills from the left when scrolled into
 * view; turns amber when few seats remain so urgency reads at a glance.
 */
export function SeatsMeter({ taken, capacity }: { taken: number; capacity: number }) {
  const reduce = useReducedMotion();
  const pct = capacity > 0 ? Math.min(100, Math.round((taken / capacity) * 100)) : 100;
  const left = Math.max(0, capacity - taken);
  const low = capacity > 0 && left / capacity <= 0.2;

  return (
    <div
      role="progressbar"
      aria-label="Tickets sold"
      aria-valuemin={0}
      aria-valuemax={capacity}
      aria-valuenow={Math.min(taken, capacity)}
      className="h-2 w-full overflow-hidden rounded-pill bg-canvas-raised ring-1 ring-hairline"
    >
      <motion.div
        className={
          "h-full rounded-pill " +
          (low
            ? "bg-gradient-to-r from-amber-400 to-orange-400"
            : "bg-gradient-to-r from-accent-soft to-accent")
        }
        initial={reduce ? { width: `${pct}%` } : { width: 0 }}
        whileInView={{ width: `${pct}%` }}
        viewport={{ once: true, amount: 0.8 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}
