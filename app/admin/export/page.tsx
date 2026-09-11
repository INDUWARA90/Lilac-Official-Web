import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getDrawUnlocked } from "@/lib/app-config";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = { title: "Export", robots: { index: false } };
export const dynamic = "force-dynamic";

const GROUPS: { title: string; note: string; items: { href: string; label: string }[] }[] = [
  {
    title: "Raffle",
    note: "Entrant personal data — handle accordingly.",
    items: [
      { href: "/api/admin/export/entries", label: "All entries" },
      { href: "/api/admin/export/winners", label: "Winners only" },
    ],
  },
  {
    title: "Tickets",
    note: "Sales report and the door / attendance list.",
    items: [
      { href: "/api/admin/export/tickets", label: "Ticket purchases (sales)" },
      { href: "/api/admin/export/checkins", label: "Check-in / attendance list" },
    ],
  },
];

export default async function ExportPage() {
  const session = await requireAdmin();
  void getDrawUnlocked(); // warm the shared cache — AdminShell needs it too, see lib/app-config.ts

  return (
    <AdminShell email={session.email}>
      <h1 className="text-2xl text-ink">Export CSV</h1>
      <p className="mt-1 font-sans text-sm text-ink-muted">
        Each link downloads a CSV. Files contain personal data — handle accordingly.
      </p>

      <div className="mt-6 flex flex-col gap-8">
        {GROUPS.map((g) => (
          <section key={g.title}>
            <h2 className="font-sans text-sm font-semibold uppercase tracking-wider text-ink-muted">
              {g.title}
            </h2>
            <p className="mt-1 font-sans text-xs text-ink-muted">{g.note}</p>
            <div className="mt-3 flex flex-col gap-3 font-sans text-sm sm:flex-row sm:flex-wrap">
              {g.items.map((it) => (
                <a
                  key={it.href}
                  href={it.href}
                  className="rounded-field border border-hairline px-4 py-2 text-accent-strong hover:border-accent"
                >
                  {it.label}
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
    </AdminShell>
  );
}
