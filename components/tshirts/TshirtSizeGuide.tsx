"use client";

import { useEffect, useRef, useState } from "react";
import { TSHIRT_SIZE_CHART } from "@/lib/tshirts-shared";

type Unit = "cm" | "in";

const fmt = (inches: string, unit: Unit) =>
  unit === "in" ? inches : (Number(inches) * 2.54).toFixed(1);

/** Transparent PNG/WebP files in /public/images. Leave as "" to use the drawn SVG shirt. */
const FRONT_IMG = "";
const BACK_IMG = "";

const SHIRT = "M77 35 101 22h38l24 13 48 30-23 39-25-13v132H77V91l-25 13L29 65l48-30Z";
const SLICES = 14;
const DEPTH = 28; // px of garment thickness
const EDGE = "#a98bcf"; // colour of the shirt's side edge (match your shirt colour)

const VIEWS = [
  { label: "Front", angle: 0 },
  { label: "Side", angle: 90 },
  { label: "Back", angle: 180 },
] as const;

/* ---------- SVG fallback faces ---------- */
function FrontSvg() {
  return (
    <svg viewBox="0 0 240 250" aria-hidden className="absolute inset-0 h-full w-full">
      <path d={SHIRT} fill="#bda1de" stroke="#684786" strokeWidth="3" strokeLinejoin="round" />
      <path d="M101 22c0 23 38 23 38 0" fill="#f8f5fa" stroke="#684786" strokeWidth="3" />
      <path d="M77 35 101 55M163 35 139 55" fill="none" stroke="#8d69b5" strokeWidth="2" />
      <text x="120" y="132" textAnchor="middle" fill="#fff" fontFamily="serif" fontSize="24" fontWeight="bold">
        LILAC
      </text>
      <text x="120" y="153" textAnchor="middle" fill="#fff" fontFamily="sans-serif" fontSize="9" letterSpacing="2">
        OFFICIAL 2026
      </text>
    </svg>
  );
}

function BackSvg() {
  return (
    <svg viewBox="0 0 240 250" aria-hidden className="absolute inset-0 h-full w-full">
      <path d={SHIRT} fill="#b497d8" stroke="#684786" strokeWidth="3" strokeLinejoin="round" />
      <path d="M101 22c0 9 38 9 38 0" fill="#f8f5fa" stroke="#684786" strokeWidth="3" />
      <text x="120" y="150" textAnchor="middle" fill="#fff" fontFamily="serif" fontSize="44" fontWeight="bold">
        2026
      </text>
    </svg>
  );
}

/* ---------- 3D shirt ---------- */
function Shirt3D({ sizeIndex, showMeasure }: { sizeIndex: number; showMeasure: boolean }) {
  const [angle, setAngle] = useState(-24);
  const angleRef = useRef(-24);
  const rotationRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const angleBadgeRef = useRef<HTMLSpanElement>(null);
  const [auto, setAuto] = useState(false);
  const [dragging, setDragging] = useState(false);
  const lastX = useRef(0);
  const autoEnabled = auto;

  const updateAngle = (update: (current: number) => number) => {
    const nextAngle = update(angleRef.current);
    angleRef.current = nextAngle;
    setAngle(nextAngle);
  };

  // Update transforms directly so React does not re-render the 3D model per frame.
  useEffect(() => {
    if (!autoEnabled || dragging) return;
    let raf = 0;
    const tick = () => {
      const nextAngle = angleRef.current + 0.45;
      angleRef.current = nextAngle;
      if (rotationRef.current) {
        rotationRef.current.style.transform = `rotateX(-8deg) rotateY(${nextAngle}deg)`;
      }
      if (shadowRef.current) {
        const scale = 0.55 + 0.45 * Math.abs(Math.cos((nextAngle * Math.PI) / 180));
        shadowRef.current.style.transform = `translateX(-50%) scaleX(${scale})`;
      }
      if (angleBadgeRef.current) {
        angleBadgeRef.current.textContent = `${((Math.round(nextAngle) % 360) + 360) % 360}°`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [autoEnabled, dragging]);

  const goTo = (target: number) => {
    setAuto(false);
    updateAngle((current) => current + ((((target - current) % 360) + 540) % 360) - 180);
  };

  const shadowScale = 0.55 + 0.45 * Math.abs(Math.cos((angle * Math.PI) / 180));
  const smooth = !dragging && !autoEnabled;
  const sizeScale = 0.86 + sizeIndex * 0.035; // the shirt grows with each size

  // the side edge takes the silhouette of the front image
  const sliceStyle = (z: number) =>
    FRONT_IMG
      ? {
        transform: `translateZ(${z}px)`,
        backgroundColor: EDGE,
        WebkitMaskImage: `url(${FRONT_IMG})`,
        maskImage: `url(${FRONT_IMG})`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }
      : { transform: `translateZ(${z}px)` };

  return (
    <div className="w-full">
      <div
        role="img"
        aria-label="Interactive 3D preview of the Lilac T-shirt. Drag or use the arrow keys to rotate."
        tabIndex={0}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          lastX.current = e.clientX;
          setDragging(true);
        }}
        onPointerMove={(e) => {
          if (!dragging) return;
          const dx = e.clientX - lastX.current;
          lastX.current = e.clientX;
          updateAngle((current) => current + dx * 0.8);
        }}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") {
            setAuto(false);
            updateAngle((current) => current - 20);
          }
          if (e.key === "ArrowRight") {
            setAuto(false);
            updateAngle((current) => current + 20);
          }
        }}
        className={
          "relative mx-auto flex h-72 w-full max-w-[340px] touch-pan-y select-none items-center justify-center overflow-hidden rounded-[2rem] border border-[#b79ddb]/40 bg-gradient-to-b from-white via-accent-wash/60 to-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_24px_50px_-28px_rgba(110,80,160,0.55)] outline-none focus-visible:ring-2 focus-visible:ring-[#b79ddb] sm:h-80 " +
          (dragging ? "cursor-grabbing" : "cursor-grab")
        }
        style={{ perspective: "900px" }}
      >
        {/* glow + stage ring */}
        <div
          ref={shadowRef}
          aria-hidden
          className="pointer-events-none absolute inset-x-8 top-10 h-44 rounded-full bg-[radial-gradient(circle,rgba(190,160,235,0.45),transparent_70%)] blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-3 left-1/2 h-10 w-56 -translate-x-1/2 rounded-[50%] border border-[#b79ddb]/40 bg-gradient-to-b from-white/70 to-accent-wash/40"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-1.5 left-1/2 h-16 w-72 -translate-x-1/2 rounded-[50%] border border-dashed border-[#b79ddb]/25"
        />

        {/* size scale */}
        <div
          className="relative -mt-4 h-56 w-[215px]"
          style={{
            transform: `scale(${sizeScale})`,
            transition: "transform 500ms cubic-bezier(0.2, 0.8, 0.2, 1)",
          }}
        >
          {/* rotation */}
          <div
            ref={rotationRef}
            className="relative h-full w-full [transform-style:preserve-3d]"
            style={{
              transform: `rotateX(-8deg) rotateY(${angle}deg)`,
              transition: smooth ? "transform 650ms cubic-bezier(0.2, 0.8, 0.2, 1)" : "none",
            }}
          >
            {/* thickness slices */}
            {Array.from({ length: SLICES }).map((_, i) => {
              const z = (i / (SLICES - 1) - 0.5) * (DEPTH - 2);
              return FRONT_IMG ? (
                <div key={i} aria-hidden className="absolute inset-0" style={sliceStyle(z)} />
              ) : (
                <svg
                  key={i}
                  viewBox="0 0 240 250"
                  aria-hidden
                  className="absolute inset-0 h-full w-full"
                  style={sliceStyle(z)}
                >
                  <path d={SHIRT} fill={EDGE} />
                </svg>
              );
            })}

            {/* FRONT */}
            <div
              className="absolute inset-0 [backface-visibility:hidden]"
              style={{ transform: `translateZ(${DEPTH / 2}px)` }}
            >
              {FRONT_IMG ? (
                // eslint-disable-next-line @next/next/no-img-element -- transparent product image
                <img
                  src={FRONT_IMG}
                  alt=""
                  draggable={false}
                  className="absolute inset-0 h-full w-full object-contain"
                />
              ) : (
                <FrontSvg />
              )}

              {/* measurement overlay (A = chest, B = length, C = sleeve) */}
              <svg
                viewBox="0 0 240 250"
                aria-hidden
                className="pointer-events-none absolute inset-0 h-full w-full"
                style={{ opacity: showMeasure ? 1 : 0, transition: "opacity 300ms" }}
              >
                <g stroke="#7c52b3" strokeWidth="2" strokeLinecap="round" fill="none">
                  <path d="M77 100H163" strokeDasharray="5 4" />
                  <path d="M77 93v14M163 93v14" />
                  <path d="M14 22V224" strokeDasharray="5 4" />
                  <path d="M7 22h14M7 224h14" />
                  <path d="m169 44 28 18" strokeDasharray="4 3" />
                  <path d="m166 49 6-9M194 67l6-9" />
                </g>
                <circle cx="120" cy="100" r="9" fill="#7c52b3" />
                <circle cx="14" cy="123" r="9" fill="#7c52b3" />
                <circle cx="190" cy="81" r="9" fill="#7c52b3" />
                <g fill="#fff" fontFamily="sans-serif" fontSize="10" fontWeight="bold" textAnchor="middle">
                  <text x="120" y="103.5">A</text>
                  <text x="14" y="126.5">B</text>
                  <text x="190" y="84.5">C</text>
                </g>
              </svg>
            </div>

            {/* BACK */}
            <div
              className="absolute inset-0 [backface-visibility:hidden]"
              style={{ transform: `rotateY(180deg) translateZ(${DEPTH / 2}px)` }}
            >
              {BACK_IMG ? (
                // eslint-disable-next-line @next/next/no-img-element -- transparent product image
                <img
                  src={BACK_IMG}
                  alt=""
                  draggable={false}
                  className="absolute inset-0 h-full w-full object-contain"
                />
              ) : (
                <BackSvg />
              )}
            </div>
          </div>
        </div>

        {/* floor shadow */}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-7 left-1/2 h-4 w-40 rounded-full bg-[#4a2f7a]/30 blur-md"
          style={{ transform: `translateX(-50%) scaleX(${shadowScale})` }}
        />

        {/* hint + angle badge */}
        <span className="pointer-events-none absolute left-2 top-3 rounded-full bg-white/85 px-2 py-1 font-sans text-[9px] font-semibold uppercase tracking-[0.08em] text-ink-muted shadow-sm backdrop-blur sm:left-1/2 sm:-translate-x-1/2 sm:px-3 sm:text-[10px] sm:tracking-[0.2em]">
          ↔ Drag to rotate
        </span>
        <span ref={angleBadgeRef} className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-white/85 px-2.5 py-1 font-sans text-[10px] font-semibold tabular-nums text-ink-muted shadow-sm backdrop-blur sm:bottom-auto sm:top-3">
          {((Math.round(angle) % 360) + 360) % 360}°
        </span>
      </div>

      {/* view controls */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {VIEWS.map((v) => (
          <button
            key={v.label}
            type="button"
            onClick={() => goTo(v.angle)}
            className="rounded-full border border-[#b79ddb]/50 bg-white/70 px-4 py-1.5 font-sans text-xs font-semibold text-ink-muted transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:bg-accent-wash hover:text-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79ddb]"
          >
            {v.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            if (autoEnabled) {
              setAngle(angleRef.current);
              setAuto(false);
            } else {
              setAuto(true);
            }
          }}
          aria-pressed={autoEnabled}
          className={
            "rounded-full px-4 py-1.5 font-sans text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79ddb] " +
            (autoEnabled
              ? "bg-gradient-to-r from-[#8e5fc7] to-[#7c52b3] text-white shadow-sm"
              : "border border-[#b79ddb]/50 bg-white/70 text-ink-muted hover:border-accent hover:text-accent-strong")
          }
        >
          {autoEnabled ? "❚❚ Pause" : "↻ 360° spin"}
        </button>
      </div>
    </div>
  );
}

/* ---------- Section ---------- */

/** Replace these standard garment measurements with the supplier's final chart before sales open. */
export function TshirtSizeGuide() {
  const [sizeIndex, setSizeIndex] = useState(0); // M
  const [unit, setUnit] = useState<Unit>("in");
  const [showMeasure, setShowMeasure] = useState(true);

  const maxChest = Number(TSHIRT_SIZE_CHART[TSHIRT_SIZE_CHART.length - 1][1]);

  return (
    <section className="relative mt-6 overflow-hidden rounded-card border border-[#b79ddb]/40 bg-canvas-raised p-4 shadow-[0_24px_60px_-34px_rgba(110,80,160,0.5)] sm:mt-8 sm:p-7">
      {/* ambient glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-[radial-gradient(circle,rgba(190,160,235,0.35),transparent_70%)] blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-16 size-64 rounded-full bg-[radial-gradient(circle,rgba(190,160,235,0.25),transparent_70%)] blur-2xl"
      />

      {/* header */}
      <header className="relative mb-6 text-center md:text-left">
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-ink-muted">
          <span className="mr-1.5 text-[#a67fd4]">❀</span>Official merch · Size guide
        </p>
        <h2 className="mt-1.5 font-serif text-3xl font-bold text-ink sm:text-4xl">Find your fit</h2>
        <div aria-hidden className="mx-auto mt-3 h-px w-24 bg-gradient-to-r from-[#b79ddb] to-transparent md:mx-0" />
      </header>

      <div className="relative grid gap-8 md:grid-cols-[0.9fr_1.1fr]">
        {/* ---------- left: 3D preview ---------- */}
        <div className="flex flex-col items-center text-center">
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-muted sm:text-xs sm:tracking-[0.18em]">
            T-shirt preview · 360°
          </p>
          <div className="mt-3 w-full">
            <Shirt3D sizeIndex={sizeIndex} showMeasure={showMeasure} />
          </div>
          <p className="mt-4 font-sans text-xs text-ink-muted">
            Design preview — final print may vary slightly.
          </p>
        </div>

        {/* ---------- right: size chart ---------- */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
              Size chart
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowMeasure((s) => !s)}
                aria-pressed={showMeasure}
                className={
                  "rounded-full border px-3 py-1 font-sans text-[11px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79ddb] " +
                  (showMeasure
                    ? "border-transparent bg-gradient-to-r from-[#8e5fc7] to-[#7c52b3] text-white shadow-sm"
                    : "border-[#b79ddb]/50 bg-white/70 text-ink-muted hover:border-accent hover:text-accent-strong")
                }
              >
                ⟷ Measurements
              </button>

              <div
                role="radiogroup"
                aria-label="Units"
                className="flex rounded-full border border-[#b79ddb]/50 bg-white/70 p-0.5"
              >
                {(["cm", "in"] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    role="radio"
                    aria-checked={unit === u}
                    onClick={() => setUnit(u)}
                    className={
                      "rounded-full px-3 py-1 font-sans text-[11px] font-semibold uppercase transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79ddb] " +
                      (unit === u
                        ? "bg-gradient-to-b from-white to-accent-wash text-accent-strong shadow-[0_1px_4px_rgba(124,82,179,0.3)]"
                        : "text-ink-muted hover:text-accent-strong")
                    }
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-3 font-sans text-sm leading-relaxed text-ink-muted">
            Measurements are for the garment laid flat. Tap a row to see that size on the shirt.
          </p>

          {/* table */}
          <div className="mt-4 overflow-hidden rounded-2xl border border-hairline bg-white/60">
            <table className="w-full table-fixed border-collapse font-sans text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-hairline bg-accent-wash/50 text-left text-[10px] uppercase tracking-wide text-ink-muted sm:text-xs">
                  <th className="w-[20%] px-2 py-2 font-semibold sm:px-3 sm:py-2.5">Size</th>
                  <th className="w-[26%] px-2 py-2 font-semibold sm:px-3 sm:py-2.5">Chest ({unit})</th>
                  <th className="w-[27%] px-2 py-2 font-semibold sm:px-3 sm:py-2.5">Length ({unit})</th>
                  <th className="w-[27%] px-2 py-2 font-semibold sm:px-3 sm:py-2.5">Sleeve ({unit})</th>
                </tr>
              </thead>
              <tbody>
                {TSHIRT_SIZE_CHART.map(([s, c, l, sleeve], i) => {
                  const active = i === sizeIndex;
                  return (
                    <tr
                      key={s}
                      onClick={() => setSizeIndex(i)}
                      className={
                        "cursor-pointer border-b border-hairline/70 text-ink transition-colors duration-200 last:border-b-0 " +
                        (active ? "bg-accent-wash" : "hover:bg-accent-wash/50")
                      }
                    >
                      <td className="relative px-2 py-2 font-semibold sm:px-3 sm:py-2.5">
                        <span
                          aria-hidden
                          className={
                            "absolute inset-y-1.5 left-0 w-1 rounded-r-full bg-[#7c52b3] transition-transform duration-300 " +
                            (active ? "scale-y-100" : "scale-y-0")
                          }
                        />
                        {s}
                      </td>
                      <td className="px-2 py-2 sm:px-3 sm:py-2.5">
                        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                          <span className="w-9 shrink-0 tabular-nums sm:w-10">{fmt(c, unit)}</span>
                          <span className="hidden h-1.5 flex-1 overflow-hidden rounded-full bg-[#b79ddb]/20 sm:block">
                            <span
                              className={
                                "block h-full rounded-full bg-gradient-to-r from-[#b79ddb] to-[#7c52b3] transition-all duration-500 " +
                                (active ? "opacity-100" : "opacity-60")
                              }
                              style={{ width: `${(Number(c) / maxChest) * 100}%` }}
                            />
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-2 tabular-nums sm:px-3 sm:py-2.5">{fmt(l, unit)}</td>
                      <td className="px-2 py-2 tabular-nums sm:px-3 sm:py-2.5">{fmt(sleeve, unit)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-3 font-sans text-xs text-ink-muted">
            <span className="font-semibold text-ink">A</span> Chest is measured across the front, under the
            arms. <span className="font-semibold text-ink">B</span> Length runs from the top of the shoulder
            to the hem. <span className="font-semibold text-ink">C</span> Sleeve runs from the shoulder seam
            to the sleeve opening.
          </p>
        </div>
      </div>
    </section>
  );
}