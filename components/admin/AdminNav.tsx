"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string; icon: ReactNode };

const s = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const NAV: NavItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: (
      <svg {...s}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: "/admin/entries",
    label: "Entries",
    icon: (
      <svg {...s}>
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
      </svg>
    ),
  },
  {
    href: "/admin/draw",
    label: "Draw winners",
    icon: (
      <svg {...s}>
        <path d="M12 3l1.8 4.6L18.5 9l-4.7 1.8L12 15l-1.8-4.2L5.5 9l4.7-1.4z" />
        <path d="M18 15l.9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9z" />
      </svg>
    ),
  },
  {
    href: "/admin/winners",
    label: "Winners",
    icon: (
      <svg {...s}>
        <path d="M8 21h8M12 17v4M6 4h12v4a6 6 0 01-12 0V4z" />
        <path d="M6 6H3v1a4 4 0 004 4M18 6h3v1a4 4 0 01-4 4" />
      </svg>
    ),
  },
  {
    href: "/admin/ads",
    label: "Ads",
    icon: (
      <svg {...s}>
        <path d="M3 10v4a1 1 0 001 1h3l6 4V5L7 9H4a1 1 0 00-1 1z" />
        <path d="M17 8a4 4 0 010 8" />
      </svg>
    ),
  },
  {
    href: "/admin/tickets",
    label: "Tickets",
    icon: (
      <svg {...s}>
        <path d="M4 7a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2a2 2 0 000-4V7z" />
        <path d="M14 5v14" strokeDasharray="2 2" />
      </svg>
    ),
  },
  {
    href: "/admin/checkin",
    label: "Check-in",
    icon: (
      <svg {...s}>
        <path d="M9 12l2 2 4-4" />
        <path d="M12 3a9 9 0 100 18 9 9 0 000-18z" />
      </svg>
    ),
  },
  {
    href: "/admin/export",
    label: "Export",
    icon: (
      <svg {...s}>
        <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
      </svg>
    ),
  },
  {
    href: "/admin/audit",
    label: "Audit log",
    icon: (
      <svg {...s}>
        <path d="M7 6H6a2 2 0 00-2 2v11a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-1" />
        <path d="M9 4h6a1 1 0 011 1v1a1 1 0 01-1 1H9a1 1 0 01-1-1V5a1 1 0 011-1z" />
        <path d="M8.5 13.5l2 2 4-4" />
      </svg>
    ),
  },
];

// A ticket manager only sees ticket review + check-in — everything else
// (dashboard, raffle entries/draw/winners, ads, export, audit) is reserved
// for the full admin; see requireFullAdmin() in lib/auth.ts, which also
// enforces this server-side regardless of what this nav shows.
const TICKET_MANAGER_HREFS = new Set(["/admin/tickets", "/admin/checkin"]);

/**
 * Admin nav — a vertical list of icon + label links, used in both the desktop
 * sidebar and the mobile drawer. Highlights the section matching the current
 * path. Pass `onNavigate` to close the mobile drawer on selection.
 *
 * "Draw winners" is hidden until the draw is unlocked (event day) — unlock it
 * from the dashboard.
 */
export function AdminNav({
  role = "admin",
  drawUnlocked = true,
  onNavigate,
}: {
  role?: "admin" | "ticket_manager";
  drawUnlocked?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = NAV.filter((i) => i.href !== "/admin/draw" || drawUnlocked).filter(
    (i) => role === "admin" || TICKET_MANAGER_HREFS.has(i.href),
  );

  return (
    <nav className="flex flex-col gap-1 px-3 py-2">
      {items.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={
              "flex items-center gap-3 rounded-field px-3 py-2 font-sans text-sm transition-colors " +
              (active
                ? "bg-accent-wash font-medium text-accent-strong"
                : "text-ink-muted hover:bg-canvas-raised hover:text-accent-strong")
            }
          >
            <span className="shrink-0 text-current">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
