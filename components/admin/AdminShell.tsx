import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { getDrawUnlocked } from "@/lib/app-config";

/**
 * Admin shell — same palette as the public site but denser and more functional
 * (brief: "a data-heavy internal tool, not a showcase page"). Wraps every
 * signed-in admin page. Left sidebar navigation from `lg` up; on narrower
 * screens it collapses to a top bar with a hamburger menu.
 */
export async function AdminShell({
  email,
  children,
}: {
  email: string;
  children: ReactNode;
}) {
  const drawUnlocked = await getDrawUnlocked();

  return (
    <div className="min-h-dvh bg-canvas lg:flex">
      <AdminSidebar email={email} drawUnlocked={drawUnlocked} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8 lg:px-10">{children}</main>
    </div>
  );
}
