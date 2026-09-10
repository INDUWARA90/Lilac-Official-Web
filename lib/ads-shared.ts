/**
 * Ad values shared between server and client code (no imports, no server-only
 * deps). The server-only loader lives in `lib/ads.ts`.
 */

export type AdMedia =
  | { kind: "youtube"; youtubeId: string }
  | { kind: "video_file"; url: string }
  | { kind: "image"; url: string };

export type Ad = { id: string; title: string } & AdMedia;

/** Minimum seconds of *actual playback* before a video ad's Next unlocks. */
export const VIDEO_MIN_WATCH_SECONDS = 5;

/** Seconds an image ad ("post") stays up before auto-advancing. */
export const IMAGE_AUTO_ADVANCE_SECONDS = 5;

/** Supabase Storage buckets for uploaded ad assets. */
export const VIDEO_BUCKET = "event-video";
export const IMAGE_BUCKET = "event-ad-images";

/** Upload caps, kept clear of Supabase's free bandwidth limits. */
export const MAX_VIDEO_BYTES = 20 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Fallback used before an admin has configured anything. */
export const DEFAULT_ADS: Ad[] = [
  {
    id: "default",
    title: "Lilac — this year's film",
    kind: "youtube",
    youtubeId: "aqz-KE-bpKQ",
  },
];

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
