import type { ReactNode } from "react";

export function Prose({ children }: { children: ReactNode }) {
  return (
    <div
      className="
        font-sans text-[15px] leading-relaxed text-ink-muted
        [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:font-serif [&_h2]:text-xl [&_h2]:text-ink
        [&_p]:my-3
        [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5
        [&_li]:my-1
        [&_a]:text-accent-strong [&_a]:underline
        [&_strong]:font-semibold [&_strong]:text-ink
      "
    >
      {children}
    </div>
  );
}
