import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

/**
 * The one button style for the public flow (brief: "buttons are outline/ghost
 * style with purple text, not solid-filled"). Two weights:
 *  - `outline` (default): hairline-to-accent border, purple label
 *  - `ghost`: no border, purple label — for secondary actions like "Skip"
 *
 * Hand-built, no component library. No hover animation beyond a color shift
 * (brief motion spec: no hover effects on every element).
 */
type Variant = "outline" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** Shows a spinner and disables the button. */
  loading?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-pill px-6 py-3 " +
  "font-sans text-sm font-semibold tracking-wide transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-canvas " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  outline:
    "border border-accent/60 text-accent-strong hover:border-accent hover:bg-accent-wash",
  ghost: "text-accent-strong hover:bg-accent-wash",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "outline", loading = false, disabled, className = "", children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      // A submit button inside a form should stay type="submit"; default the
      // rest to "button" so a stray click never submits a form.
      type={rest.type ?? "button"}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${className}`}
      aria-busy={loading || undefined}
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
