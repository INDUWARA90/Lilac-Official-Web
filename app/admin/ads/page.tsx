import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getAds } from "@/lib/ads";
import { getDrawUnlocked } from "@/lib/app-config";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdsManager } from "@/components/admin/AdsManager";

export const metadata: Metadata = { title: "Ads", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdsPage() {
  const session = await requireAdmin();
  const [ads] = await Promise.all([getAds(), getDrawUnlocked()]); // latter warms AdminShell's shared cache

  return (
    <AdminShell email={session.email}>
      <h1 className="text-2xl text-ink">Sponsor ads</h1>
      <p className="mt-1 font-sans text-sm text-ink-muted">
        Visitors watch every ad below, in order, before they can enter the draw —
        video ads require 5&nbsp;seconds of real playback, image ads advance
        automatically after 5&nbsp;seconds. YouTube links use no Supabase
        bandwidth; uploads are capped at 20&nbsp;MB for video and 5&nbsp;MB for
        images.
      </p>

      <div className="mt-6">
        <AdsManager ads={ads} />
      </div>
    </AdminShell>
  );
}
