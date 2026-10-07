"use client";

import { useEffect, useRef, useState } from "react";

type ShirtColor = "white" | "black";
type ShirtSide = "front" | "back";

const SHIRT_IMAGES: Record<ShirtColor, Record<ShirtSide, string>> = {
  white: {
    front: "/shirts/w%20-%20f.png",
    back: "/shirts/w%20-%20b.png",
  },
  black: {
    front: "/shirts/b%20-%20f.png",
    back: "/shirts/b%20-%20b.png",
  },
};

const toggleClass =
  "rounded-full px-3 py-1.5 font-sans text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79ddb]";

const VIEWS = [
  { label: "Front", angle: 0 },
  { label: "Back", angle: 180 },
] as const;

function angleToViewDistance(angle: number, target: number) {
  return Math.abs((((angle - target + 540) % 360) - 180));
}

export function TshirtPreview({ sizeIndex }: { sizeIndex: number }) {
  const [color, setColor] = useState<ShirtColor>("white");
  const [zoom, setZoom] = useState(100);
  const [angle, setAngle] = useState(-24);
  const [spinning, setSpinning] = useState(false);
  const [dragging, setDragging] = useState(false);
  const rotationRef = useRef<HTMLDivElement>(null);
  const angleBadgeRef = useRef<HTMLSpanElement>(null);
  const angleRef = useRef(-24);
  const lastX = useRef(0);
  const shirtScale = 1 + sizeIndex * 0.035;

  const updateAngle = (nextAngle: number) => {
    angleRef.current = nextAngle;
    setAngle(nextAngle);
    if (rotationRef.current) {
      rotationRef.current.style.transform = `rotateY(${nextAngle}deg)`;
    }
  };

  const goToView = (target: number) => {
    setSpinning(false);
    const shortestTurn = ((((target - angleRef.current) % 360) + 540) % 360) - 180;
    updateAngle(angleRef.current + shortestTurn);
  };

  useEffect(() => {
    if (!spinning || dragging) return;
    let frame = 0;
    const spin = () => {
      const nextAngle = angleRef.current + 0.45;
      angleRef.current = nextAngle;
      if (rotationRef.current) {
        rotationRef.current.style.transform = `rotateY(${nextAngle}deg)`;
      }
      if (angleBadgeRef.current) {
        angleBadgeRef.current.textContent = `${((Math.round(nextAngle) % 360) + 360) % 360}°`;
      }
      frame = requestAnimationFrame(spin);
    };
    frame = requestAnimationFrame(spin);
    return () => cancelAnimationFrame(frame);
  }, [spinning, dragging]);

  const displayAngle = ((Math.round(angle) % 360) + 360) % 360;

  return (
    <div className="w-full">
      <div
        role="img"
        aria-label="Rotating T-shirt preview. Drag to rotate or use the arrow keys."
        tabIndex={0}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          lastX.current = event.clientX;
          setDragging(true);
          setSpinning(false);
        }}
        onPointerMove={(event) => {
          if (!dragging) return;
          const delta = event.clientX - lastX.current;
          lastX.current = event.clientX;
          updateAngle(angleRef.current + delta * 0.8);
        }}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") {
            setSpinning(false);
            updateAngle(angleRef.current - 20);
          }
          if (event.key === "ArrowRight") {
            setSpinning(false);
            updateAngle(angleRef.current + 20);
          }
        }}
        className={
          "relative mx-auto flex aspect-square w-full max-w-[340px] touch-pan-y select-none items-center justify-center overflow-hidden rounded-[2rem] border border-[#b79ddb]/40 bg-gradient-to-b from-white via-accent-wash/60 to-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_24px_50px_-28px_rgba(110,80,160,0.55)] outline-none focus-visible:ring-2 focus-visible:ring-[#b79ddb] " +
          (dragging ? "cursor-grabbing" : "cursor-grab")
        }
        style={{ perspective: "900px" }}
      >
        <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-full bg-white/85 px-2.5 py-1 font-sans text-[10px] font-semibold uppercase tracking-wide text-ink-muted shadow-sm">
          ↔ Drag to rotate
        </span>
        <span ref={angleBadgeRef} className="pointer-events-none absolute right-3 top-3 z-10 rounded-full bg-white/85 px-2.5 py-1 font-sans text-[10px] font-semibold tabular-nums text-ink-muted shadow-sm">
          {displayAngle}°
        </span>
        <div
          className="relative aspect-square w-full"
          style={{
            transform: `scale(${shirtScale * zoom / 100})`,
            transition: "transform 300ms ease",
          }}
        >
          <div
            ref={rotationRef}
            className="relative h-full w-full [transform-style:preserve-3d]"
            style={{
              transform: `rotateY(${angle}deg)`,
              transition: spinning || dragging ? "none" : "transform 650ms cubic-bezier(0.2, 0.8, 0.2, 1)",
            }}
          >
            <div
              className="absolute inset-0 [backface-visibility:hidden]"
              style={{ transform: "translateZ(8px)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- transparent product mockup */}
              <img
                src={SHIRT_IMAGES[color].front}
                alt=""
                draggable={false}
                className="absolute inset-0 h-full w-full object-contain"
              />
            </div>
            <div
              className="absolute inset-0 [backface-visibility:hidden]"
              style={{ transform: "rotateY(180deg) translateZ(8px)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- transparent product mockup */}
              <img
                src={SHIRT_IMAGES[color].back}
                alt=""
                draggable={false}
                className="absolute inset-0 h-full w-full object-contain"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <div role="group" aria-label="Preview zoom" className="flex items-center gap-1 rounded-full border border-[#b79ddb]/50 bg-white/70 p-0.5">
          <button
            type="button"
            onClick={() => setZoom((current) => Math.max(80, current - 10))}
            disabled={zoom <= 80}
            aria-label="Zoom out"
            className="size-8 rounded-full font-sans text-base font-semibold text-ink-muted hover:bg-accent-wash hover:text-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79ddb] disabled:cursor-not-allowed disabled:opacity-40"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => setZoom(100)}
            aria-label={`Reset zoom, currently ${zoom}%`}
            className="min-w-12 rounded-full px-1 py-1.5 font-sans text-[11px] font-semibold tabular-nums text-ink-muted hover:text-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79ddb]"
          >
            {zoom}%
          </button>
          <button
            type="button"
            onClick={() => setZoom((current) => Math.min(150, current + 10))}
            disabled={zoom >= 150}
            aria-label="Zoom in"
            className="size-8 rounded-full font-sans text-base font-semibold text-ink-muted hover:bg-accent-wash hover:text-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79ddb] disabled:cursor-not-allowed disabled:opacity-40"
          >
            +
          </button>
        </div>
        <div role="group" aria-label="T-shirt color" className="flex rounded-full border border-[#b79ddb]/50 bg-white/70 p-0.5">
          {(["white", "black"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setColor(value)}
              aria-pressed={color === value}
              className={
                toggleClass +
                " capitalize " +
                (color === value
                  ? "bg-gradient-to-r from-[#8e5fc7] to-[#7c52b3] text-white shadow-sm"
                  : "text-ink-muted hover:text-accent-strong")
              }
            >
              {value}
            </button>
          ))}
        </div>
        {VIEWS.map((view) => {
          const active = angleToViewDistance(angle, view.angle) < 10;
          return (
            <button
              key={view.label}
              type="button"
              onClick={() => goToView(view.angle)}
              aria-pressed={active}
              className={
                toggleClass +
                " border border-[#b79ddb]/50 " +
                (active
                  ? "bg-accent-wash text-accent-strong"
                  : "bg-white/70 text-ink-muted hover:text-accent-strong")
              }
            >
              {view.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setSpinning((current) => !current)}
          aria-pressed={spinning}
          className={
            toggleClass +
            " border border-[#b79ddb]/50 " +
            (spinning
              ? "bg-gradient-to-r from-[#8e5fc7] to-[#7c52b3] text-white shadow-sm"
              : "bg-white/70 text-ink-muted hover:text-accent-strong")
          }
        >
          {spinning ? "❚❚ Pause" : "↻ 360° spin"}
        </button>
      </div>
    </div>
  );
}
