import { forwardRef, useId } from "react";
import type { SelectHTMLAttributes } from "react";

/**
 * Underline-style select, matching TextField. Used for demographics
 * (age range, gender, district) where a constrained list is clearer than free text.
 */
interface SelectFieldProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "id" | "children"> {
  label: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  options: readonly string[];
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  function SelectField(
    { label, hint, error, placeholder, options, className = "", required, defaultValue, value, onChange, ...rest },
    ref,
  ) {
    const id = useId();
    const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

    // A <select> is controlled OR uncontrolled, never both. When the caller
    // passes `value`, wire it up controlled; otherwise fall back to an empty
    // default so the disabled placeholder shows first.
    const selectionProps =
      value !== undefined ? { value, onChange } : { defaultValue: defaultValue ?? "" };

    return (
      <div className={`flex flex-col gap-1.5 ${className}`}>
        <label htmlFor={id} className="font-sans text-sm font-medium text-ink-muted">
          {label}
          {required && <span className="text-accent-strong"> *</span>}
        </label>
        <select
          ref={ref}
          id={id}
          required={required}
          {...selectionProps}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={
            "border-0 border-b bg-transparent px-0 py-2 font-sans text-base text-ink " +
            "focus:outline-none focus:ring-0 " +
            (error
              ? "border-red-400 focus:border-red-500"
              : "border-hairline focus:border-accent")
          }
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
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
