import { forwardRef, useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type" | "children"> {
  children: ReactNode;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { children, error, className = "", ...rest },
  ref,
) {
  const id = useId();
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-start gap-3">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-1 size-4 shrink-0 rounded-[4px] border-hairline text-accent accent-accent focus:ring-accent"
          {...rest}
        />
        <label htmlFor={id} className="font-sans text-sm leading-relaxed text-ink">
          {children}
        </label>
      </div>
      {error && (
        <p id={`${id}-error`} className="pl-7 font-sans text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
});
