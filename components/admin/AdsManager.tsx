"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { AddAdForm } from "@/components/admin/AddAdForm";
import type { Ad } from "@/lib/ads-shared";

type AdsAction =
  | { action: "delete"; id: string }
  | { action: "reorder"; order: string[] };

async function postAdsAction(body: AdsAction) {
  const res = await fetch("/api/admin/ads", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await res.json()) as { ok: boolean; error?: string };
}

const KIND_LABEL: Record<Ad["kind"], string> = {
  youtube: "YouTube video",
  video_file: "Uploaded video",
  image: "Image / post",
};

/**
 * Manage the ordered list of sponsor ads shown on `/`. Visitors watch every ad
 * here, in order, before they can enter the draw — see `AdsStep`.
 */
export function AdsManager({ ads }: { ads: Ad[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function move(id: string, direction: -1 | 1) {
    const index = ads.findIndex((a) => a.id === id);
    const swapWith = index + direction;
    if (swapWith < 0 || swapWith >= ads.length) return;

    const order = ads.map((a) => a.id);
    [order[index], order[swapWith]] = [order[swapWith], order[index]];

    setBusyId(id);
    setError(null);
    const result = await postAdsAction({ action: "reorder", order });
    if (!result.ok) setError(result.error ?? "Could not reorder.");
    setBusyId(null);
    router.refresh();
  }

  async function remove(id: string) {
    setBusyId(id);
    setError(null);
    const result = await postAdsAction({ action: "delete", id });
    if (!result.ok) setError(result.error ?? "Could not remove.");
    setBusyId(null);
    router.refresh();
  }

  return (
    <div className="max-w-2xl">
      <ol className="flex flex-col gap-3">
        {ads.map((ad, i) => (
          <li
            key={ad.id}
            className="flex items-center gap-3 rounded-card border border-hairline p-3"
          >
            <div className="flex flex-col gap-1 font-sans text-[10px] text-ink-muted">
              <button
                type="button"
                disabled={i === 0 || busyId !== null}
                onClick={() => move(ad.id, -1)}
                className="disabled:opacity-30 hover:text-accent-strong"
                aria-label="Move up"
              >
                ▲
              </button>
              <button
                type="button"
                disabled={i === ads.length - 1 || busyId !== null}
                onClick={() => move(ad.id, 1)}
                className="disabled:opacity-30 hover:text-accent-strong"
                aria-label="Move down"
              >
                ▼
              </button>
            </div>

            <div className="flex-1">
              <p className="font-sans text-sm font-medium text-ink">{ad.title}</p>
              <p className="font-sans text-xs text-ink-muted">
                {KIND_LABEL[ad.kind]} · slot {i + 1} of {ads.length}
              </p>
            </div>

            <Button
              variant="ghost"
              className="px-3 py-1 text-xs"
              loading={busyId === ad.id}
              disabled={busyId !== null && busyId !== ad.id}
              onClick={() => remove(ad.id)}
            >
              Remove
            </Button>
          </li>
        ))}
        {ads.length === 0 && (
          <p className="font-sans text-sm text-ink-muted">
            No ads yet — the fallback film shows until you add one below.
          </p>
        )}
      </ol>

      {error && <p className="mt-3 font-sans text-sm text-red-600">{error}</p>}

      <div className="mt-8 border-t border-hairline pt-6">
        <AddAdForm onAdded={() => router.refresh()} />
      </div>
    </div>
  );
}
