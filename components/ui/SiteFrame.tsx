import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";

/**
 * Shared public shell: centered single column, generous whitespace, content
 * capped at ~560px (brief layout spec). Header + footer are intentionally
 * sparse on the public flow.
 */
export function SiteFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex justify-center px-6 py-7">
        <div className="flex w-full max-w-[560px] items-center justify-between">
          <Link href="/" aria-label="Lilac — home">
            <Logo />
          </Link>
          <Link
            href="/results"
            className="font-sans text-sm font-medium text-ink-muted transition-colors hover:text-accent-strong"
          >
            Results
          </Link>
        </div>
      </header>

      <main className="flex flex-1 justify-center px-6 pb-20">
        <div className="w-full max-w-[560px]">{children}</div>
      </main>

      <footer className="flex justify-center border-t border-hairline px-6 py-8">
        <div className="flex w-full max-w-[560px] flex-col gap-3 font-sans text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Lilac. All rights reserved.</span>
          <nav className="flex flex-wrap gap-x-4 gap-y-1">
            <Link href="/about" className="hover:text-accent-strong">
              About us
            </Link>
            <Link href="/privacy" className="hover:text-accent-strong">
              Privacy policy
            </Link>
            <Link href="/terms" className="hover:text-accent-strong">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-accent-strong">
              Contact us
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
