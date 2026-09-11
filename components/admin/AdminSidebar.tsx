"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { AdminNav } from "@/components/admin/AdminNav";

/**
 * Admin navigation chrome. A fixed left sidebar from `lg` up; below that, a top
 * bar with a hamburger button that slides in a left-side drawer holding the
 * same links.
 */
export function AdminSidebar({
  email,
  drawUnlocked,
}: {
  email: string;
  drawUnlocked: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden border-hairline lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-60 lg:shrink-0 lg:flex-col lg:border-r">
        <div className="px-5 py-4">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto">
          <AdminNav drawUnlocked={drawUnlocked} />
        </div>
        <div className="border-t border-hairline px-5 py-4">
          <AccountBlock email={email} />
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-hairline px-5 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="admin-drawer"
          className="rounded-field border border-hairline p-2 text-ink-muted transition-colors hover:border-accent hover:text-accent-strong"
        >
          <MenuIcon />
        </button>
        <Link href="/admin" className="flex items-center gap-2">
          <Brand />
        </Link>
      </div>

      {/* Mobile drawer */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden={!open}
        className={
          "fixed inset-0 z-40 bg-ink/30 transition-opacity duration-200 lg:hidden " +
          (open ? "opacity-100" : "pointer-events-none opacity-0")
        }
      />
      <div
        id="admin-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Admin menu"
        className={
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[82%] flex-col border-r border-hairline bg-canvas transition-transform duration-200 lg:hidden " +
          (open ? "translate-x-0" : "-translate-x-full")
        }
      >
        <div className="flex items-center justify-between px-5 py-4">
          <Brand />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="rounded-field border border-hairline p-2 text-ink-muted transition-colors hover:border-accent hover:text-accent-strong"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <AdminNav drawUnlocked={drawUnlocked} onNavigate={() => setOpen(false)} />
        </div>
        <div className="border-t border-hairline px-5 py-4">
          <AccountBlock email={email} />
        </div>
      </div>
    </>
  );
}

function Brand() {
  return (
    <span className="flex items-center gap-2">
      <Logo className="h-6 w-auto" />
      <span className="font-sans text-xs font-semibold uppercase tracking-wider text-ink-muted">
        Admin
      </span>
    </span>
  );
}

function AccountBlock({ email }: { email: string }) {
  return (
    <>
      <Link
        href="/"
        className="mb-3 flex items-center gap-2 font-sans text-xs font-medium text-ink-muted transition-colors hover:text-accent-strong"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M5 12h14M13 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        View public site
      </Link>
      <p className="truncate font-sans text-xs text-ink-muted" title={email}>
        {email}
      </p>
      <form action="/api/admin/logout" method="post" className="mt-2">
        <button
          type="submit"
          className="w-full rounded-field border border-hairline px-2.5 py-1.5 font-sans text-xs font-medium text-ink-muted transition-colors hover:border-accent hover:text-accent-strong"
        >
          Sign out
        </button>
      </form>
    </>
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
