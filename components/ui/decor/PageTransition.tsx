"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * A lightweight CSS fade + rise on page entry. Keying by pathname restarts
 * the animation after route changes without loading the motion runtime.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="lilac-enter">
      {children}
    </div>
  );
}
