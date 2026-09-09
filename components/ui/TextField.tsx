import { forwardRef, useId } from "react";
import type { InputHTMLAttributes } from "react";

/**
 * Minimal underline-style text input (brief: "form inputs are minimal
 * underline-style, not boxed"). Label sits above; a single hairline underline
 * that turns accent on focus; error text replaces the hint when present.
 */
interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string;
  /** Helper text shown under the field when there's no error. */
  hint?: string;
  /** Validation message; when set, the field renders in its error state. */
  error?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField({ label, hint, error, className = "", required, ...rest }, ref) {
    const id = useId();
    const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

    return (
      <div className={`flex flex-col gap-1.5 ${className}`}>
        <label htmlFor={id} className="font-sans text-sm font-medium text-ink-muted">
          {label}
          {required && <span className="text-accent-strong"> *</span>}
        </label>
        <input
          ref={ref}
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={
            "border-0 border-b bg-transparent px-0 py-2 font-sans text-base text-ink " +
            "placeholder:text-ink-muted/50 focus:outline-none focus:ring-0 " +
            (error
              ? "border-red-400 focus:border-red-500"
              : "border-hairline focus:border-accent")
          }
          {...rest}
        />
        {error ? (
          <p id={`${id}-error`} className="font-sans text-xs text-red-600">
            {error}
          </p>
        ) : hint ? (
          <p id={`${id}-hint`} className="font-sans text-xs text-ink-muted">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);
