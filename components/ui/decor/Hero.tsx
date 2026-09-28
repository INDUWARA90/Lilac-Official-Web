"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.13, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 22, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.75, ease: EASE } },
};

/**
 * Hero entrance: each <HeroItem> inside fades up out of a blur, one after
 * another. Wrap the hero content in <HeroStagger>; under
 * `prefers-reduced-motion` everything just renders in place.
 */
export function HeroStagger({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.section
      className={className}
      variants={container}
      initial={reduce ? false : "hidden"}
      animate="show"
    >
      {children}
    </motion.section>
  );
}

export function HeroItem({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={item}>
      {children}
    </motion.div>
  );
}
