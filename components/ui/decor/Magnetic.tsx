"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import type { PointerEvent, ReactNode } from "react";

/**
 * Makes its child drift a little toward the cursor while hovered, then spring
 * back — a "magnetic" call-to-action. Mouse-only; inert for touch and under
 * `prefers-reduced-motion`.
 */
export function Magnetic({
  children,
  strength = 0.28,
  className = "",
}: {
  children: ReactNode;
  /** Fraction of the cursor's offset from center that the child follows. */
  strength?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const spring = { stiffness: 220, damping: 16, mass: 0.4 };
  const x = useSpring(mx, spring);
  const y = useSpring(my, spring);

  function onMove(e: PointerEvent<HTMLDivElement>) {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - (r.left + r.width / 2)) * strength);
    my.set((e.clientY - (r.top + r.height / 2)) * strength);
  }
  function onLeave() {
    mx.set(0);
    my.set(0);
  }

  return (
    <motion.div
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ x, y }}
      className={`inline-block ${className}`}
    >
      {children}
    </motion.div>
  );
}
