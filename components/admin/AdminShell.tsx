import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";

/**
 * Admin shell — same palette as the public site but denser and more functional
 * (brief: "a data-heavy internal tool, not a showcase page"). Wraps every
 * signed-in admin page.
 */
const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/entries", label: "Entries" },
  { href: "/admin/draw", label: "Draw winners" },
  { href: "/admin/winners", label: "Winners" },
  { href: "/admin/video", label: "Video" },
  { href: "/admin/export", label: "Export" },
  { href: "/admin/audit", label: "Audit log" },
];

export function AdminShell({
  email,
  children,
}: {
  email: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="border-b border-hairline">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2">
              <Logo className="text-base" />
              <span className="font-sans text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Admin
              </span>
            </Link>
            <nav className="flex gap-4">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="font-sans text-sm text-ink-muted transition-colors hover:text-accent-strong"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 font-sans text-xs text-ink-muted">
            <span className="hidden sm:inline">{email}</span>
            <form action="/api/admin/logout" method="post">
              <button
                type="submit"
                className="rounded-field border border-hairline px-2.5 py-1 font-medium text-ink-muted transition-colors hover:border-accent hover:text-accent-strong"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
