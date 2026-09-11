import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getTicketSettings } from "@/lib/tickets";
import { getDrawUnlocked } from "@/lib/app-config";
import { AdminShell } from "@/components/admin/AdminShell";
import { TicketSettingsForm } from "@/components/admin/TicketSettingsForm";

export const metadata: Metadata = { title: "Ticket settings", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function TicketSettingsPage() {
  const session = await requireAdmin();
  const [settings] = await Promise.all([getTicketSettings(), getDrawUnlocked()]); // latter warms AdminShell's shared cache

  return (
    <AdminShell email={session.email}>
      <Link href="/admin/tickets" className="font-sans text-sm text-accent-strong hover:underline">
        ← All tickets
      </Link>
      <h1 className="mt-3 text-2xl text-ink">Ticket settings</h1>
      <p className="mt-1 font-sans text-sm text-ink-muted">
        Price, capacity, and the bank details buyers transfer to. Closing sales or
        lowering capacity below what&rsquo;s sold won&rsquo;t cancel existing purchases.
      </p>

      <div className="mt-6">
        <TicketSettingsForm current={settings} />
      </div>
    </AdminShell>
  );
}
