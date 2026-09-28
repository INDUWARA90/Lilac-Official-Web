"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * A soft fade + rise on page entry (framer-motion). Each route here is its
 * own page.tsx wrapping SiteFrame — the App Router unmounts/remounts this
 * tree on navigation rather than keeping it alive across routes, so there's
 * no persistent component to run an *exit* transition on; `key={pathname}`
 * plus the initial->animate step is what actually fires, on every mount.
 * Falls back to an instant, un-animated mount under `prefers-reduced-motion`.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  return (
    <motion.div
      key={pathname}
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
