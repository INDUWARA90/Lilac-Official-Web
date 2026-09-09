import { SiteFrame } from "@/components/ui/SiteFrame";

/**
 * Temporary scaffold for pages whose real content lands in a later stage
 * (static copy in Stage 3, results in Stage 6). Clearly marked as placeholder
 * per the brief ("use clearly-marked placeholder text for now").
 */
export function PlaceholderPage({
  title,
  note,
}: {
  title: string;
  note: string;
}) {
  return (
    <SiteFrame>
      <section className="flex flex-col gap-4 py-16">
        <span className="w-fit rounded-pill bg-accent-wash px-3 py-1 font-sans text-xs font-semibold uppercase tracking-wider text-accent-strong">
          Placeholder
        </span>
        <h1 className="text-3xl text-ink">{title}</h1>
        <p className="font-sans text-sm leading-relaxed text-ink-muted">{note}</p>
      </section>
    </SiteFrame>
  );
}
