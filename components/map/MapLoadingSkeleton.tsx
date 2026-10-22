"use client";

export function MapLoadingSkeleton() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
      <div className="relative flex h-24 w-24 items-center justify-center">
        <div className="absolute inset-0 animate-ping rounded-full bg-accent/15" />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-hairline bg-canvas shadow-sm">
          <svg
            className="h-6 w-6 animate-spin text-accent"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        </div>
      </div>
      <p className="mt-4 font-serif text-base font-medium text-ink">
        Loading 3D Campus Map
      </p>
      <p className="mt-1 text-xs text-ink-muted">
        Initialising low-poly ground and interactive landmarks...
      </p>
    </div>
  );
}
