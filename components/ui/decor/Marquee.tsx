import { Sparkle } from "@/components/ui/decor/Sparkle";

/**
 * A slow, endlessly scrolling strip of short phrases separated by sparkles.
 * Pure CSS (`.lilac-marquee-track`) — the list is rendered twice so the loop
 * is seamless; the duplicate is hidden from assistive tech. Edges fade out.
 */
export function Marquee({ items }: { items: readonly string[] }) {
  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center gap-8 pr-8">
      {items.map((t, i) => (
        <li
          key={t}
          className="flex items-center gap-8 font-serif text-lg whitespace-nowrap text-ink-muted"
        >
          {t}
          <Sparkle size={14} gold={i % 2 === 0} delay={i * 0.4} />
        </li>
      ))}
    </ul>
  );

  return (
    <div className="lilac-marquee overflow-hidden" role="presentation">
      <div className="lilac-marquee-track flex w-max">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
