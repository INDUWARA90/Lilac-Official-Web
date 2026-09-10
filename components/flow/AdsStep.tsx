"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { IMAGE_AUTO_ADVANCE_SECONDS, VIDEO_MIN_WATCH_SECONDS, type Ad } from "@/lib/ads-shared";
import { loadYouTubeIframeApi } from "@/lib/youtube-iframe-api";

/**
 * Step 1 — the sponsor ads. Every ad in `ads` is shown, in order; only once the
 * last one's requirement is met does `onDone` fire and the visitor reaches the
 * form. There is no skip (sponsor requirement: every ad must be watched).
 *
 *  - video (YouTube or uploaded file): "Next" stays disabled until the visitor
 *    has *actually played* VIDEO_MIN_WATCH_SECONDS of it — pausing or seeking
 *    ahead doesn't count.
 *  - image ("post"): auto-advances after IMAGE_AUTO_ADVANCE_SECONDS.
 */
export function AdsStep({
  ads,
  onDone,
}: {
  ads: Ad[];
  onDone: () => void;
}) {
  const [index, setIndex] = useState(0);
  const ad = ads[index];
  const isLast = index === ads.length - 1;

  function advance() {
    if (isLast) onDone();
    else setIndex((i) => i + 1);
  }

  return (
    <section className="flex flex-col items-center gap-8 pt-4 text-center">
      <div className="space-y-3">
        <h1 className="text-3xl text-ink">{ad.title}</h1>
        <p className="mx-auto max-w-sm font-sans text-sm leading-relaxed text-ink-muted">
          A word from this year&rsquo;s sponsors, then enter the draw.
        </p>
        {ads.length > 1 && (
          <p className="font-sans text-xs uppercase tracking-wider text-ink-muted">
            {index + 1} of {ads.length}
          </p>
        )}
      </div>

      {ad.kind === "image" ? (
        <ImageAd key={ad.id} ad={ad} isLast={isLast} onDone={advance} />
      ) : (
        <VideoAd key={ad.id} ad={ad} isLast={isLast} onDone={advance} />
      )}
    </section>
  );
}

function ImageAd({
  ad,
  isLast,
  onDone,
}: {
  ad: Extract<Ad, { kind: "image" }>;
  isLast: boolean;
  onDone: () => void;
}) {
  // This component is keyed by `ad.id` in the parent, so it remounts per ad —
  // the initial state and a mount-only effect are enough, no reset needed.
  const [remaining, setRemaining] = useState(IMAGE_AUTO_ADVANCE_SECONDS);

  useEffect(() => {
    const tick = setInterval(() => setRemaining((s) => Math.max(0, s - 1)), 1000);
    const done = setTimeout(onDone, IMAGE_AUTO_ADVANCE_SECONDS * 1000);
    return () => {
      clearInterval(tick);
      clearTimeout(done);
    };
    // `onDone` is a fresh closure each render but always points at the same
    // "advance" logic — safe to leave out of deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="lilac-frame-in w-full overflow-hidden rounded-card bg-canvas-raised ring-1 ring-hairline">
        <div className="relative aspect-video w-full">
          {/* eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL */}
          <img
            src={ad.url}
            alt={ad.title}
            className="absolute inset-0 size-full object-cover"
          />
        </div>
      </div>
      <p className="font-sans text-xs text-ink-muted">
        {isLast ? "Continuing to the form" : "Next ad"} in {remaining}s…
      </p>
    </>
  );
}

function VideoAd({
  ad,
  isLast,
  onDone,
}: {
  ad: Extract<Ad, { kind: "youtube" } | { kind: "video_file" }>;
  isLast: boolean;
  onDone: () => void;
}) {
  const [watched, setWatched] = useState(0);
  const ready = watched >= VIDEO_MIN_WATCH_SECONDS;

  return (
    <>
      <div className="lilac-frame-in w-full overflow-hidden rounded-card bg-canvas-raised ring-1 ring-hairline">
        <div className="relative aspect-video w-full">
          {ad.kind === "youtube" ? (
            <YouTubePlayer youtubeId={ad.youtubeId} title={ad.title} onWatched={setWatched} />
          ) : (
            <FileVideoPlayer url={ad.url} title={ad.title} onWatched={setWatched} />
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <Button onClick={onDone} disabled={!ready}>
          {isLast ? "Continue to the form" : "Next ad"}
        </Button>
        {!ready && (
          <span className="font-sans text-xs text-ink-muted">
            Watch {Math.ceil(VIDEO_MIN_WATCH_SECONDS - watched)}s more to continue…
          </span>
        )}
      </div>
    </>
  );
}

function FileVideoPlayer({
  url,
  title,
  onWatched,
}: {
  url: string;
  title: string;
  onWatched: (seconds: number) => void;
}) {
  const lastTime = useRef(0);
  const watchedRef = useRef(0);

  return (
    <video
      className="absolute inset-0 size-full"
      src={url}
      aria-label={title}
      controls
      playsInline
      onTimeUpdate={(e) => {
        const t = e.currentTarget.currentTime;
        const delta = t - lastTime.current;
        lastTime.current = t;
        // Only count small forward steps — a real-time tick, not a seek —
        // so scrubbing ahead can't fake the watch requirement.
        if (delta > 0 && delta < 1) {
          watchedRef.current = Math.min(VIDEO_MIN_WATCH_SECONDS, watchedRef.current + delta);
          onWatched(watchedRef.current);
        }
      }}
      onSeeking={(e) => {
        lastTime.current = e.currentTarget.currentTime;
      }}
      onEnded={() => {
        watchedRef.current = VIDEO_MIN_WATCH_SECONDS;
        onWatched(watchedRef.current);
      }}
    />
  );
}

function YouTubePlayer({
  youtubeId,
  title,
  onWatched,
}: {
  youtubeId: string;
  title: string;
  onWatched: (seconds: number) => void;
}) {
  // Stable across SSR + hydration (a render-time counter would not be).
  const elementId = `yt-ad-${useId().replace(/:/g, "")}`;
  const watchedRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let poll: ReturnType<typeof setInterval> | null = null;
    let player: import("@/lib/youtube-iframe-api").YTPlayer | null = null;

    loadYouTubeIframeApi().then((YT) => {
      if (cancelled) return;
      player = new YT.Player(elementId, {
        width: "100%",
        height: "100%",
        videoId: youtubeId,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onReady: (e) => {
            e.target.getIframe().classList.add("absolute", "inset-0", "size-full");
            // The player's methods are only callable now — start polling
            // real playback time here, not before `onReady`.
            poll = setInterval(() => {
              if (cancelled) return;
              if (player?.getPlayerState?.() === YT.PlayerState.PLAYING) {
                watchedRef.current = Math.min(
                  VIDEO_MIN_WATCH_SECONDS,
                  watchedRef.current + 0.25,
                );
                onWatched(watchedRef.current);
              }
            }, 250);
          },
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.ENDED) {
              watchedRef.current = VIDEO_MIN_WATCH_SECONDS;
              onWatched(watchedRef.current);
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (poll) clearInterval(poll);
      player?.destroy?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [youtubeId]);

  return <div id={elementId} className="absolute inset-0 size-full" aria-label={title} />;
}
