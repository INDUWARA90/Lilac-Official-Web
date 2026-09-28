"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";

/**
 * A thin lilac bar pinned to the top of the viewport that fills as the page
 * is scrolled — a small cue on the longer pages (About, Privacy, Terms).
 * Hidden entirely under `prefers-reduced-motion`.
 */
export function ScrollProgress() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 28, restDelta: 0.001 });

  if (reduce) return null;

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-accent to-accent-strong"
    />
  );
}
