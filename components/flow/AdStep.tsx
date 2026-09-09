"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { SKIP_AFTER_SECONDS, type VideoConfig } from "@/lib/video-shared";

/**
 * Step 1 — the ad. YouTube embed or an uploaded file (the admin picks which on
 * /admin/video). A Skip control fades in after a few seconds — the video is
 * "not fully locked" (brief).
 *
 * Motion: the frame gets the one deliberate entrance animation on the site
 * (`.lilac-frame-in`, defined in globals.css). Nothing else here animates.
 */
export function AdStep({
  video,
  onDone,
}: {
  video: VideoConfig;
  onDone: (watchedAtIso: string) => void;
}) {
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setCanSkip(true), SKIP_AFTER_SECONDS * 1000);
    return () => clearTimeout(t);
  }, []);

  function finish() {
    onDone(new Date().toISOString());
  }

  return (
    <section className="flex flex-col items-center gap-8 pt-4 text-center">
      <div className="space-y-3">
        <h1 className="text-3xl text-ink">{video.title}</h1>
        <p className="mx-auto max-w-sm font-sans text-sm leading-relaxed text-ink-muted">
          Watch this year&rsquo;s film, then enter the draw. It takes about a minute.
        </p>
      </div>

      <div className="lilac-frame-in w-full overflow-hidden rounded-card bg-canvas-raised ring-1 ring-hairline">
        <div className="relative aspect-video w-full">
          {video.kind === "youtube" ? (
            <iframe
              className="absolute inset-0 size-full"
              src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?rel=0&modestbranding=1`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              className="absolute inset-0 size-full"
              src={video.url}
              controls
              playsInline
            />
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <Button onClick={finish}>Continue to the form</Button>
        {canSkip && (
          <Button variant="ghost" onClick={finish} className="px-3 py-1 text-xs">
            Skip the film
          </Button>
        )}
        {!canSkip && (
          <span className="font-sans text-xs text-ink-muted">
            You can skip in a few seconds.
          </span>
        )}
      </div>
    </section>
  );
}
