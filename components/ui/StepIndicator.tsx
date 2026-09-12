
const STEPS = ["Watch", "Enter", "Confirm"] as const;

export type FlowStep = (typeof STEPS)[number];

export function StepIndicator({ current }: { current: FlowStep }) {
  const currentIndex = STEPS.indexOf(current);

  return (
    <ol
      className="flex items-center justify-center gap-2.5 font-sans text-[11px]"
      aria-label={`Step ${currentIndex + 1} of ${STEPS.length}: ${current}`}
    >
      {STEPS.map((step, i) => {
        const active = i === currentIndex;
        const done = i < currentIndex;
        return (
          <li key={step} className="flex items-center gap-2.5">
            <span className="flex items-center gap-2">
              <span
                aria-hidden
                className={
                  "flex size-5 items-center justify-center rounded-pill text-[10px] font-semibold " +
                  (active
                    ? "bg-accent text-white"
                    : done
                      ? "bg-accent text-white"
                      : "text-ink-muted ring-1 ring-hairline")
                }
              >
                {done ? (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2.5 6.5l2.5 2.5 4.5-5"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={
                  "uppercase tracking-[0.14em] " +
                  (active ? "font-semibold text-accent-strong" : "text-ink-muted")
                }
              >
                {step}
              </span>
            </span>
            {i < STEPS.length - 1 && (
              <span aria-hidden className="h-px w-5 bg-hairline" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
