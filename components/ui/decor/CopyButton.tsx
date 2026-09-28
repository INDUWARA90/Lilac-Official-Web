"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/** Small "copy" chip — the icon swaps to an animated tick for a moment after copying. */
export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const reduce = useReducedMotion();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return; // clipboard blocked (insecure context / permissions) — stay quiet
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied" : `${label} ${text}`}
      className="inline-flex items-center gap-1.5 rounded-pill border border-hairline px-2.5 py-1 font-sans text-xs font-medium text-accent-strong transition-colors hover:border-accent hover:bg-accent-wash"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={copied ? "done" : "idle"}
          initial={reduce ? false : { opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.15 }}
          className="inline-flex"
          aria-hidden
        >
          {copied ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2.5 6.5l2.5 2.5 4.5-5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="4" y="4" width="6.5" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
              <path
                d="M8 2.5V2A1 1 0 007 1H2.5a1 1 0 00-1 1v4.5a1 1 0 001 1H3"
                stroke="currentColor"
                strokeWidth="1.3"
              />
            </svg>
          )}
        </motion.span>
      </AnimatePresence>
      {copied ? "Copied!" : label}
    </button>
  );
}
