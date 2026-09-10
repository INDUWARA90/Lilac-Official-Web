"use client";

/** Minimal shape of the bits of the YouTube IFrame Player API we actually use. */
export type YTPlayerState = {
  PLAYING: number;
  PAUSED: number;
  ENDED: number;
};

export type YTPlayer = {
  // Methods only become callable once the player has fired `onReady`.
  getPlayerState?: () => number;
  getIframe: () => HTMLIFrameElement;
  destroy?: () => void;
};

type YTPlayerOptions = {
  videoId: string;
  width?: string | number;
  height?: string | number;
  playerVars?: Record<string, unknown>;
  events?: {
    onReady?: (event: { target: YTPlayer }) => void;
    onStateChange?: (event: { data: number; target: YTPlayer }) => void;
  };
};

export type YT = {
  Player: new (elementId: string, options: YTPlayerOptions) => YTPlayer;
  PlayerState: YTPlayerState;
};

declare global {
  interface Window {
    YT?: YT;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YT> | null = null;

/** Loads the YouTube IFrame Player API script once per page load. */
export function loadYouTubeIframeApi(): Promise<YT> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("loadYouTubeIframeApi called on the server"));
  }
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve) => {
    const prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prevReady?.();
      resolve(window.YT as YT);
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return apiPromise;
}
