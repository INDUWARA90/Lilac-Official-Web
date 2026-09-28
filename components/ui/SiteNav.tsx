"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Logo";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/tickets", label: "Tickets" },
  { href: "/about", label: "About us" },
  { href: "/contact", label: "Contact us" },
];

const RESULTS_LINK = { href: "/results", label: "Results" };

/**
 * Public site navigation — shown on every non-admin page (admin has its own
 * sidebar). Inline links from `sm` up; below that a hamburger button slides in
 * a left-side drawer holding the same links.
 */
export function SiteNav({ showResults = false }: { showResults?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = showResults ? [...LINKS, RESULTS_LINK] : LINKS;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="border-b border-hairline">
      <div className="mx-auto flex w-full max-w-[560px] items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="site-drawer"
            className="rounded-field border border-hairline p-2 text-ink-muted transition-colors hover:border-accent hover:text-accent-strong sm:hidden"
          >
            <MenuIcon />
          </button>
          <Link href="/" aria-label="Lilac — home" className="lilac-logo-halo">
            <Logo />
          </Link>
        </div>

        <nav className="hidden gap-6 sm:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? "page" : undefined}
              className={
                // Underline grows from the left on hover and stays for the
                // current page.
                "relative font-sans text-sm font-medium transition-colors " +
                "after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:origin-left after:bg-accent " +
                "after:transition-transform after:duration-300 motion-reduce:after:transition-none " +
                (isActive(l.href)
                  ? "text-accent-strong after:scale-x-100"
                  : "text-ink-muted after:scale-x-0 hover:text-accent-strong hover:after:scale-x-100")
              }
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile drawer */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden={!open}
        className={
          "fixed inset-0 z-40 bg-ink/30 transition-opacity duration-200 sm:hidden " +
          (open ? "opacity-100" : "pointer-events-none opacity-0")
        }
      />
      <div
        id="site-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[82%] flex-col border-r border-hairline bg-canvas transition-transform duration-200 sm:hidden " +
          (open ? "translate-x-0" : "-translate-x-full")
        }
      >
        <div className="flex items-center justify-between px-5 py-4">
          <Logo />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="rounded-field border border-hairline p-2 text-ink-muted transition-colors hover:border-accent hover:text-accent-strong"
          >
            <CloseIcon />
          </button>
        </div>
        <nav className="flex flex-col gap-1 px-3 py-2">
          {links.map((l, i) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              style={{ transitionDelay: open ? `${100 + i * 55}ms` : "0ms" }}
              aria-current={isActive(l.href) ? "page" : undefined}
              className={
                "rounded-field px-3 py-2 font-sans text-sm transition-[color,background-color,opacity,transform] duration-300 motion-reduce:transition-none " +
                (open ? "translate-x-0 opacity-100 " : "-translate-x-4 opacity-0 ") +
                (isActive(l.href)
                  ? "bg-accent-wash font-medium text-accent-strong"
                  : "text-ink-muted hover:bg-canvas-raised hover:text-accent-strong")
              }
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
