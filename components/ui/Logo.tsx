/**
 * Brand mark — PLACEHOLDER.
 *
 * The real logo is the word "Lilac" in Sinhala script (ලයිලැක්), not ready yet.
 * For now this is a plain serif wordmark with a small diamond accent so it reads
 * as a deliberate mark, not unstyled text. When the real artwork lands, replace
 * the inner markup with an <svg>/<Image> and keep the `className` sizing API.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-baseline gap-1.5 font-serif text-xl font-semibold tracking-tight text-accent-strong ${className}`}
    >
      <span
        aria-hidden
        className="inline-block size-1.5 translate-y-[-0.15em] rotate-45 bg-accent"
      />
      Lilac
    </span>
  );
}
