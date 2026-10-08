"use client";

import { createPortal } from "react-dom";

export function FormErrorToast({
  message,
  onDismiss,
}: {
  message: string | null;
  onDismiss: () => void;
}) {
  if (!message || typeof document === "undefined") return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-4 sm:top-6">
      <div
        role="alert"
        className="pointer-events-auto flex w-full max-w-lg items-start gap-3 rounded-2xl border border-red-200 bg-white px-4 py-3 text-red-800 shadow-xl shadow-red-950/10"
      >
        <span
          aria-hidden="true"
          className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-red-100 font-sans text-sm font-bold text-red-700"
        >
          !
        </span>
        <p className="flex-1 font-sans text-sm leading-relaxed">{message}</p>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error message"
          className="rounded-full px-2 py-1 font-sans text-lg leading-none text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
        >
          ×
        </button>
      </div>
    </div>,
    document.body,
  );
}
