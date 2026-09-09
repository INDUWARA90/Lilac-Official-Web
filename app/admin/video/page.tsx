import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getVideoConfig } from "@/lib/video";
import { AdminShell } from "@/components/admin/AdminShell";
import { VideoManager } from "@/components/admin/VideoManager";

export const metadata: Metadata = { title: "Video", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function VideoPage() {
  const session = await requireAdmin();
  const current = await getVideoConfig();

  return (
    <AdminShell email={session.email}>
      <h1 className="text-2xl text-ink">Ad video</h1>
      <p className="mt-1 font-sans text-sm text-ink-muted">
        Paste a YouTube link (preferred — it uses no Supabase bandwidth) or upload
        a file up to 20&nbsp;MB.
      </p>

      <div className="mt-6">
        <VideoManager current={current} />
      </div>
    </AdminShell>
  );
}
