import type { ReactNode } from "react";
import { SiteFrame } from "@/components/ui/SiteFrame";
import { Prose } from "@/components/ui/Prose";

/**
 * Layout for About / Privacy / Terms. Final copy for these pages isn't ready,
 * so every one carries a visible "Draft" badge (brief: "use clearly-marked
 * placeholder text for now").
 */
export function ContentPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <SiteFrame>
      <article className="py-12">
        <span className="w-fit rounded-pill bg-accent-wash px-3 py-1 font-sans text-xs font-semibold uppercase tracking-wider text-accent-strong">
          Draft · placeholder copy
        </span>
        <h1 className="mt-4 text-3xl text-ink">{title}</h1>
        <p className="mt-3 font-sans text-base leading-relaxed text-ink-muted">
          {intro}
        </p>

        <div className="mt-8">
          <Prose>{children}</Prose>
        </div>

        <p className="mt-12 border-t border-hairline pt-4 font-sans text-xs text-ink-muted">
          This is placeholder text. Final, reviewed copy will replace it before
          launch.
        </p>
      </article>
    </SiteFrame>
  );
}
