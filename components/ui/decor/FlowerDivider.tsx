/** A small lavender-sprig flourish, replacing a plain `<hr>` on themed pages. */
export function FlowerDivider({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`flex items-center justify-center gap-3 ${className}`}>
      <span className="h-px w-16 bg-linear-to-r from-transparent to-hairline sm:w-24" />
      <svg viewBox="0 0 32 20" width={32} height={20} fill="none" className="lailac-sway">
        <path
          d="M16 10c-2-3-5-4-8-3 1 3 3 5 8 5-2 3-1 6 0 8 1-2 2-5 0-8 5 0 7-2 8-5-3-1-6 0-8 3Z"
          fill="var(--color-accent-soft)"
        />
        <circle cx="16" cy="10" r="2" fill="var(--color-magic-gold)" />
      </svg>
      <span className="h-px w-16 bg-linear-to-l from-transparent to-hairline sm:w-24" />
    </div>
  );
}
