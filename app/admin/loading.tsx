/**
 * Instant fallback for every /admin/* route while its server component awaits
 * Supabase (all admin pages are `force-dynamic` — see AGENTS.md/CLAUDE.md
 * discussion on render latency). Matches `AdminShell`'s frame dimensions
 * (sidebar width, content max-width/padding) so the real content doesn't
 * jump when it swaps in.
 */
function Block({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-card bg-canvas-raised ${className}`} />;
}

export default function AdminLoading() {
  return (
    <div className="min-h-dvh bg-canvas lg:flex">
      <aside className="hidden border-hairline lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-60 lg:shrink-0 lg:flex-col lg:border-r lg:px-5 lg:py-4">
        <Block className="h-6 w-24" />
        <div className="mt-8 flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Block key={i} className="h-4 w-32" />
          ))}
        </div>
      </aside>

      <div className="flex items-center justify-between border-b border-hairline px-5 py-3 lg:hidden">
        <Block className="h-8 w-8" />
        <Block className="h-6 w-20" />
        <span />
      </div>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8 lg:px-10">
        <Block className="h-8 w-48" />
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Block key={i} className="h-20" />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Block key={i} className="h-16" />
          ))}
        </div>
        <Block className="mt-8 h-64" />
      </main>
    </div>
  );
}
