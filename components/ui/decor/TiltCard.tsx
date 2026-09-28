"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import type { PointerEvent, ReactNode } from "react";

/**
 * Wraps a card so it tilts toward the mouse in 3D and picks up a soft glare
 * that follows the cursor. Mouse-only: touch and pen pointers, and visitors
 * with `prefers-reduced-motion`, just get the plain static card.
 */
export function TiltCard({
  children,
  className = "",
  max = 7,
}: {
  children: ReactNode;
  className?: string;
  /** Maximum tilt in degrees. */
  max?: number;
}) {
  const reduce = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const spring = { stiffness: 220, damping: 22, mass: 0.5 };
  const rotateX = useSpring(useTransform(py, [0, 1], [max, -max]), spring);
  const rotateY = useSpring(useTransform(px, [0, 1], [-max, max]), spring);
  const glare = useTransform(
    [px, py],
    ([x, y]: number[]) =>
      `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.65), transparent 55%)`,
  );

  function onMove(e: PointerEvent<HTMLDivElement>) {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  }
  function onLeave() {
    px.set(0.5);
    py.set(0.5);
  }

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      className={`group relative ${className}`}
    >
      {children}
      <motion.div
        aria-hidden
        style={{ backgroundImage: glare }}
        className="pointer-events-none absolute inset-0 rounded-card opacity-0 mix-blend-soft-light transition-opacity duration-300 group-hover:opacity-100"
      />
    </motion.div>
  );
}
