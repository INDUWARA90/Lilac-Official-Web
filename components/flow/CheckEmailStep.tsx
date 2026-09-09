/**
 * Shown right after a successful submit. The entry exists but is UNVERIFIED —
 * it isn't counted until the emailed link is used.
 */
export function CheckEmailStep({ email }: { email: string }) {
  return (
    <section className="flex flex-col items-center gap-6 pt-8 text-center">
      <div
        aria-hidden
        className="flex size-14 items-center justify-center rounded-pill bg-accent-wash text-accent-strong"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      </div>

      <div className="space-y-3">
        <h1 className="text-3xl text-ink">Confirm your entry</h1>
        <p className="mx-auto max-w-sm font-sans text-sm leading-relaxed text-ink-muted">
          We&rsquo;ve sent a confirmation link to{" "}
          <span className="font-semibold text-ink">{email}</span>. Open it to
          finalise your entry. Your entry is not counted until it has been
          confirmed.
        </p>
        <p className="mx-auto max-w-sm font-sans text-xs leading-relaxed text-ink-muted">
          If it doesn&rsquo;t arrive within a few minutes, please check your spam
          folder.
        </p>
      </div>
    </section>
  );
}
