"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes, MouseEvent } from "react";
import confetti from "canvas-confetti";

type Variant = "outline" | "ghost" | "magic";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-pill px-6 py-3 " +
  "font-sans text-sm font-semibold tracking-wide transition-[color,background-color,border-color,transform] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-canvas " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  outline:
    "border border-accent/60 text-accent-strong hover:border-accent hover:bg-accent-wash active:scale-[0.97]",
  ghost: "text-accent-strong hover:bg-accent-wash active:scale-[0.97]",
  // The primary/CTA look for the fairytale theme's key actions (Continue,
  // Submit entry, Buy tickets) — gradient fill + a light sweep + press-scale,
  // see .lailac-btn-magic in app/globals.css.
  magic: "lailac-btn-magic border-0 text-white disabled:hover:shadow-none",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "outline", loading = false, disabled, className = "", children, onClick, ...rest },
  ref,
) {
  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    onClick?.(e);
    // A tiny sparkle pop from the button on click — the "magic" variant's
    // CTAs only (Continue, Submit entry, Buy tickets), not every button.
    if (variant === "magic" && !disabled && !loading) fireClickSparkle(e.currentTarget);
  }

  return (
    <button
      ref={ref}
      type={rest.type ?? "button"}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${className}`}
      aria-busy={loading || undefined}
      onClick={handleClick}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
});

function fireClickSparkle(el: HTMLButtonElement) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const rect = el.getBoundingClientRect();
  confetti({
    particleCount: 14,
    spread: 70,
    startVelocity: 22,
    gravity: 1,
    scalar: 0.55,
    ticks: 90,
    colors: ["#5a45d6", "#c9b8f0", "#e3b04b"],
    origin: {
      x: (rect.left + rect.width / 2) / window.innerWidth,
      y: (rect.top + rect.height / 2) / window.innerHeight,
    },
  });
}
