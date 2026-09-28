import { forwardRef, useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { Sparkle } from "@/components/ui/decor/Sparkle";

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
        <span className="relative mt-1 inline-flex shrink-0">
          <input
            ref={ref}
            id={id}
            type="checkbox"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            className="size-4 rounded-[4px] border-hairline text-accent accent-accent transition-shadow focus:shadow-[0_0_0_4px_var(--color-accent-wash)] focus:ring-accent"
            {...rest}
          />
          {rest.checked && (
            <Sparkle size={14} gold className="absolute -top-2 -right-2" duration={1.6} />
          )}
        </span>
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
