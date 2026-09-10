"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { createAnonClient } from "@/lib/supabase/client";
import { MAX_VIDEO_BYTES, MAX_IMAGE_BYTES, type Ad } from "@/lib/ads-shared";

type AdsAction =
  | { action: "create_youtube"; url: string; title: string }
  | { action: "create_video_file"; path: string; title: string }
  | { action: "create_image"; path: string; title: string }
  | { action: "update_title"; id: string; title: string }
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

function AddAdForm({ onAdded }: { onAdded: () => void }) {
  const [kind, setKind] = useState<Ad["kind"]>("youtube");
  const [title, setTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadAndCreate(): Promise<{ ok: boolean; error?: string }> {
    if (!file) return { ok: false, error: "Choose a file." };
    const maxBytes = kind === "video_file" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > maxBytes) {
      return { ok: false, error: `That file is over ${Math.round(maxBytes / (1024 * 1024))} MB.` };
    }

    const urlRes = await fetch("/api/admin/ads/upload-url", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        size: file.size,
        contentType: file.type || (kind === "video_file" ? "video/mp4" : "image/jpeg"),
      }),
    });
    const urlData = (await urlRes.json()) as {
      ok: boolean;
      error?: string;
      bucket?: string;
      path?: string;
      token?: string;
    };
    if (!urlData.ok || !urlData.path || !urlData.token || !urlData.bucket) {
      return { ok: false, error: urlData.error ?? "Could not start the upload." };
    }

    const { error: upErr } = await createAnonClient()
      .storage.from(urlData.bucket)
      .uploadToSignedUrl(urlData.path, urlData.token, file, {
        contentType: file.type || undefined,
      });
    if (upErr) return { ok: false, error: "The upload failed. Please try again." };

    return postAdsAction({
      action: kind === "video_file" ? "create_video_file" : "create_image",
      path: urlData.path,
      title,
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const result =
        kind === "youtube"
          ? await postAdsAction({ action: "create_youtube", url: youtubeUrl, title })
          : await uploadAndCreate();

      if (result.ok) {
        setTitle("");
        setYoutubeUrl("");
        setFile(null);
        onAdded();
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    } catch {
      setError("We couldn't reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <p className="font-sans text-xs font-semibold uppercase tracking-wider text-ink-muted">
        Add an ad
      </p>

      <div className="flex flex-wrap gap-4 font-sans text-sm">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="add-kind"
            checked={kind === "youtube"}
            onChange={() => setKind("youtube")}
            className="accent-accent"
          />
          YouTube link
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="add-kind"
            checked={kind === "video_file"}
            onChange={() => setKind("video_file")}
            className="accent-accent"
          />
          Upload video
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="add-kind"
            checked={kind === "image"}
            onChange={() => setKind("image")}
            className="accent-accent"
          />
          Upload image (post)
        </label>
      </div>

      <TextField label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} />

      {kind === "youtube" ? (
        <TextField
          label="YouTube URL"
          required
          placeholder="https://youtu.be/…"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
        />
      ) : (
        <label className="flex flex-col gap-1.5 font-sans text-sm font-medium text-ink-muted">
          {kind === "video_file" ? "Video file (max 20 MB)" : "Image file (max 5 MB)"}
          <input
            type="file"
            accept={kind === "video_file" ? "video/*" : "image/*"}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm text-ink file:mr-3 file:rounded-field file:border file:border-hairline file:bg-transparent file:px-3 file:py-1.5 file:text-accent-strong"
          />
        </label>
      )}

      {error && <p className="font-sans text-sm text-red-600">{error}</p>}

      <Button type="submit" loading={busy} className="self-start">
        Add ad
      </Button>
    </form>
  );
}
