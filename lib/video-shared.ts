/**
 * Ad-video values shared between server and client code (no imports, no
 * server-only deps). The server-only loader lives in `lib/video.ts`.
 */

export type VideoConfig =
  | { kind: "youtube"; youtubeId: string; title: string }
  | { kind: "file"; url: string; title: string };

/** Seconds before the Skip control appears (brief: "not fully locked"). */
export const SKIP_AFTER_SECONDS = 5;

/** Supabase Storage bucket for uploaded ad videos. */
export const VIDEO_BUCKET = "event-video";

/** Cap uploads at ~20MB to stay clear of Supabase's free bandwidth limits. */
export const MAX_VIDEO_BYTES = 20 * 1024 * 1024;

/** Fallback used before an admin has configured anything. */
export const DEFAULT_VIDEO: VideoConfig = {
  kind: "youtube",
  youtubeId: "aqz-KE-bpKQ",
  title: "Lilac — this year's film",
};

/**
 * Extract a YouTube video id from the common URL shapes
 * (watch?v=, youtu.be/, /embed/, /shorts/) or accept a bare 11-char id.
 */
export function parseYouTubeId(input: string): string | null {
  const s = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  try {
    const url = new URL(s);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.slice(1);
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (host === "youtube.com" || host === "youtube-nocookie.com" || host === "m.youtube.com") {
      const v = url.searchParams.get("v");
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
      const m = url.pathname.match(/^\/(embed|shorts|v)\/([a-zA-Z0-9_-]{11})/);
      if (m) return m[2];
    }
    return null;
  } catch {
    return null;
  }
}
