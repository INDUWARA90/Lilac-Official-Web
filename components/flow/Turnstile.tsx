"use client";

import { useEffect, useRef } from "react";
import { publicEnv } from "@/lib/env";

/**
 * Cloudflare Turnstile widget (brief: "Turnstile/hCaptcha challenge before
 * submit"). Hand-wired, no wrapper package.
 *
 * Turnstile isn't provisioned yet. When `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is
 * empty we render a small notice and hand back an empty token — the server
 * (`verifyTurnstile`) bypasses in dev and fails closed in production.
 */
declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        },
      ) => string;
      remove: (id: string) => void;
    };
  }
}

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export function Turnstile({ onToken }: { onToken: (token: string) => void }) {
  const siteKey = publicEnv.turnstileSiteKey;
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  // `onToken` from the parent is memoised with useCallback, so this effect
  // runs once per siteKey.
  useEffect(() => {
    if (!siteKey) {
      onToken("");
      return;
    }

    let cancelled = false;

    function renderWidget() {
      if (cancelled || widgetIdRef.current) return;
      if (!window.turnstile || !containerRef.current) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: "light",
        callback: (token) => onToken(token),
        "expired-callback": () => onToken(""),
        "error-callback": () => onToken(""),
      });
    }

    if (window.turnstile) {
      renderWidget();
    } else {
      let script = document.querySelector<HTMLScriptElement>(
        `script[src="${SCRIPT_SRC}"]`,
      );
      if (!script) {
        script = document.createElement("script");
        script.src = SCRIPT_SRC;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", renderWidget);
    }

    return () => {
      cancelled = true;
      const id = widgetIdRef.current;
      if (id && window.turnstile) window.turnstile.remove(id);
      widgetIdRef.current = null;
    };
  }, [siteKey, onToken]);

  if (!siteKey) {
    return (
      <p className="rounded-field bg-canvas-raised px-3 py-2 font-sans text-xs text-ink-muted ring-1 ring-hairline">
        Bot protection is not configured in this environment.
      </p>
    );
  }

  return <div ref={containerRef} />;
}
