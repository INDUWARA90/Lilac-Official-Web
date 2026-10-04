"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { createAnonClient } from "@/lib/supabase/client";
import { MAX_IMAGE_BYTES, MAX_VIDEO_BYTES, type Ad } from "@/lib/ads-shared";

type AdsAction =
  | { action: "create_youtube"; url: string; title: string }
  | { action: "create_video_file"; path: string; title: string }
  | { action: "create_image"; path: string; title: string };

async function postAdsAction(body: AdsAction) {
  const res = await fetch("/api/admin/ads", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await res.json()) as { ok: boolean; error?: string };
}

export function AddAdForm({ onAdded }: { onAdded: () => void }) {
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

    const { error: uploadError } = await createAnonClient()
      .storage.from(urlData.bucket)
      .uploadToSignedUrl(urlData.path, urlData.token, file, {
        contentType: file.type || undefined,
      });
    if (uploadError) return { ok: false, error: "The upload failed. Please try again." };

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
