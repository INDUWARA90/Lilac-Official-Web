"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { createAnonClient } from "@/lib/supabase/client";
import { MAX_VIDEO_BYTES, type VideoConfig } from "@/lib/video-shared";

/**
 * Set the ad video: a YouTube link, or a file uploaded straight to Supabase
 * Storage via a signed URL (so the file bytes never pass through our API route).
 */
export function VideoManager({ current }: { current: VideoConfig }) {
  const router = useRouter();
  const [mode, setMode] = useState<"youtube" | "file">(current.kind);
  const [title, setTitle] = useState(current.title);
  const [youtubeUrl, setYoutubeUrl] = useState(
    current.kind === "youtube"
      ? `https://youtu.be/${current.youtubeId}`
      : "",
  );
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function saveYoutube() {
    const res = await fetch("/api/admin/video", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind: "youtube", url: youtubeUrl, title }),
    });
    return (await res.json()) as { ok: boolean; error?: string };
  }

  async function saveFile() {
    if (!file) return { ok: false, error: "Choose a file." };
    if (file.size > MAX_VIDEO_BYTES) {
      return { ok: false, error: "That file is over 20 MB." };
    }

    // 1. Ask our server for a signed upload URL.
    const urlRes = await fetch("/api/admin/video/upload-url", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        size: file.size,
        contentType: file.type || "video/mp4",
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

    // 2. Upload the bytes directly to Supabase Storage.
    const { error: upErr } = await createAnonClient()
      .storage.from(urlData.bucket)
      .uploadToSignedUrl(urlData.path, urlData.token, file, {
        contentType: file.type || "video/mp4",
      });
    if (upErr) return { ok: false, error: "The upload failed. Please try again." };

    // 3. Save the config pointing at the uploaded file.
    const res = await fetch("/api/admin/video", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind: "file", path: urlData.path, title }),
    });
    return (await res.json()) as { ok: boolean; error?: string };
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setBusy(true);
    try {
      const result = mode === "youtube" ? await saveYoutube() : await saveFile();
      if (result.ok) {
        setSaved(true);
        router.refresh();
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
    <div className="max-w-lg">
      {/* Current */}
      <div className="rounded-card border border-hairline p-4">
        <p className="font-sans text-xs font-semibold uppercase tracking-wider text-ink-muted">
          Currently showing
        </p>
        <p className="mt-1 font-sans text-sm text-ink">
          {current.title} —{" "}
          {current.kind === "youtube" ? "YouTube" : "uploaded file"}
        </p>
        <div className="mt-3 aspect-video w-full overflow-hidden rounded-field bg-canvas-raised ring-1 ring-hairline">
          {current.kind === "youtube" ? (
            <iframe
              className="size-full"
              src={`https://www.youtube-nocookie.com/embed/${current.youtubeId}`}
              title="Current ad video"
              allowFullScreen
            />
          ) : (
            <video className="size-full" src={current.url} controls playsInline />
          )}
        </div>
      </div>

      {/* Change */}
      <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
        <div className="flex gap-4 font-sans text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="mode"
              checked={mode === "youtube"}
              onChange={() => setMode("youtube")}
              className="accent-accent"
            />
            YouTube link
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="mode"
              checked={mode === "file"}
              onChange={() => setMode("file")}
              className="accent-accent"
            />
            Upload file
          </label>
        </div>

        <TextField
          label="Title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {mode === "youtube" ? (
          <TextField
            label="YouTube URL"
            required
            placeholder="https://youtu.be/…"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
          />
        ) : (
          <label className="flex flex-col gap-1.5 font-sans text-sm font-medium text-ink-muted">
            Video file (max 20 MB)
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm text-ink file:mr-3 file:rounded-field file:border file:border-hairline file:bg-transparent file:px-3 file:py-1.5 file:text-accent-strong"
            />
          </label>
        )}

        {error && <p className="font-sans text-sm text-red-600">{error}</p>}
        {saved && (
          <p className="font-sans text-sm text-ink">Saved. The change is live.</p>
        )}

        <Button type="submit" loading={busy} className="self-start">
          Save video
        </Button>
      </form>
    </div>
  );
}
