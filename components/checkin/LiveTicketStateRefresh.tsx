"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";

/** Refreshes protected ticket state while a staff member is actively watching. */
export function LiveTicketStateRefresh({ intervalMs = 2_000 }: { intervalMs?: number }) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();

  useEffect(() => {
    const refresh = () => {
      if (document.hidden || isRefreshing) return;
      startTransition(() => router.refresh());
    };
    const timer = window.setInterval(refresh, intervalMs);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [intervalMs, isRefreshing, router, startTransition]);

  return (
    <p className="mt-2 font-sans text-xs text-ink-muted" aria-live="polite">
      Live ticket state: updates every 2 seconds while this page is open.
    </p>
  );
}
