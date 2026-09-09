import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = { title: "Export", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ExportPage() {
  const session = await requireAdmin();

  return (
    <AdminShell email={session.email}>
      <h1 className="text-2xl text-ink">Export CSV</h1>
      <p className="mt-1 font-sans text-sm text-ink-muted">
        Two separate downloads. Files contain personal data — handle accordingly.
      </p>

      <div className="mt-6 flex flex-col gap-3 font-sans text-sm sm:flex-row">
        {/* Plain links: the browser downloads the file the route returns
            (content-disposition: attachment). */}
        <a
          href="/api/admin/export/entries"
          className="rounded-field border border-hairline px-4 py-2 text-accent-strong hover:border-accent"
        >
          Download all entries
        </a>
        <a
          href="/api/admin/export/winners"
          className="rounded-field border border-hairline px-4 py-2 text-accent-strong hover:border-accent"
        >
          Download winners only
        </a>
      </div>
    </AdminShell>
  );
}
