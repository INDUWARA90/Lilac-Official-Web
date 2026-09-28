"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface Speck {
  id: number;
  x: number;
  y: number;
  gold: boolean;
}

const MAX_SPECKS = 14;
const MIN_GAP_PX = 28; // don't spawn one for every pixel of movement

/**
 * A trail of tiny fairy-dust flecks following the cursor — desktop only
 * (`pointer: fine`, so this never runs on the touch devices most visitors
 * here are actually using) and off entirely under `prefers-reduced-motion`.
 * Framer Motion handles the spawn-in/fade-out; a hard cap on concurrent
 * specks keeps it cheap regardless of how fast the mouse moves.
 */
export function CursorTrail() {
  const [specks, setSpecks] = useState<Speck[]>([]);
  const enabledRef = useRef(false);
  const lastRef = useRef({ x: -1000, y: -1000 });
  const idRef = useRef(0);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    enabledRef.current = fine && !reduce;
    if (!enabledRef.current) return;

    function onMove(e: MouseEvent) {
      const dx = e.clientX - lastRef.current.x;
      const dy = e.clientY - lastRef.current.y;
      if (dx * dx + dy * dy < MIN_GAP_PX * MIN_GAP_PX) return;
      lastRef.current = { x: e.clientX, y: e.clientY };

      const id = idRef.current++;
      setSpecks((prev) => [
        ...prev.slice(-(MAX_SPECKS - 1)),
        { id, x: e.clientX, y: e.clientY, gold: id % 3 === 0 },
      ]);
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  function remove(id: number) {
    setSpecks((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      <AnimatePresence>
        {specks.map((s) => (
          <motion.span
            key={s.id}
            className="absolute rounded-full"
            style={{
              left: s.x,
              top: s.y,
              width: 6,
              height: 6,
              backgroundColor: s.gold ? "var(--color-magic-gold)" : "var(--color-accent-soft)",
            }}
            initial={{ opacity: 0.9, scale: 1, y: 0 }}
            animate={{ opacity: 0, scale: 0.3, y: -18 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            onAnimationComplete={() => remove(s.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
