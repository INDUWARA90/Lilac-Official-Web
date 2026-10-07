"use client";

import { useState } from "react";
import { TshirtPreview } from "@/components/tshirts/TshirtPreview";
import { TSHIRT_SIZE_CHART } from "@/lib/tshirts-shared";

type Unit = "cm" | "in";

const fmt = (inches: string, unit: Unit) =>
  unit === "in" ? inches : (Number(inches) * 2.54).toFixed(1);

/** Replace these standard garment measurements with the supplier's final chart before sales open. */
export function TshirtSizeGuide() {
  const [sizeIndex, setSizeIndex] = useState(0);
  const [unit, setUnit] = useState<Unit>("in");
  const maxChest = Number(TSHIRT_SIZE_CHART[TSHIRT_SIZE_CHART.length - 1][1]);

  return (
    <section className="relative mt-6 overflow-hidden rounded-card border border-[#b79ddb]/40 bg-canvas-raised p-4 shadow-[0_24px_60px_-34px_rgba(110,80,160,0.5)] sm:mt-8 sm:p-7">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-[radial-gradient(circle,rgba(190,160,235,0.35),transparent_70%)] blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-16 size-64 rounded-full bg-[radial-gradient(circle,rgba(190,160,235,0.25),transparent_70%)] blur-2xl"
      />

      <header className="relative mb-6 text-center md:text-left">
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-ink-muted">
          <span className="mr-1.5 text-[#a67fd4]">❀</span>Official merch · Size guide
        </p>
        <h2 className="mt-1.5 font-serif text-3xl font-bold text-ink sm:text-4xl">Find your fit</h2>
        <div aria-hidden className="mx-auto mt-3 h-px w-24 bg-gradient-to-r from-[#b79ddb] to-transparent md:mx-0" />
      </header>

      <div className="relative grid gap-8 md:grid-cols-[0.9fr_1.1fr]">
        <div className="flex flex-col items-center text-center">
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-muted sm:text-xs sm:tracking-[0.18em]">
            T-shirt preview
          </p>
          <div className="mt-3 w-full">
            <TshirtPreview sizeIndex={sizeIndex} />
          </div>
          <p className="mt-4 font-sans text-xs text-ink-muted">
            Design preview — final print may vary slightly.
          </p>
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
              Size chart
            </p>
            <div
              role="radiogroup"
              aria-label="Units"
              className="flex rounded-full border border-[#b79ddb]/50 bg-white/70 p-0.5"
            >
              {(["cm", "in"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={unit === value}
                  onClick={() => setUnit(value)}
                  className={
                    "rounded-full px-3 py-1 font-sans text-[11px] font-semibold uppercase transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79ddb] " +
                    (unit === value
                      ? "bg-gradient-to-b from-white to-accent-wash text-accent-strong shadow-[0_1px_4px_rgba(124,82,179,0.3)]"
                      : "text-ink-muted hover:text-accent-strong")
                  }
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-3 font-sans text-sm leading-relaxed text-ink-muted">
            Measurements are for the garment laid flat. Tap a row to see that size on the shirt.
          </p>

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
                {TSHIRT_SIZE_CHART.map(([size, chest, length, sleeve], index) => {
                  const active = index === sizeIndex;
                  return (
                    <tr
                      key={size}
                      onClick={() => setSizeIndex(index)}
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
                        {size}
                      </td>
                      <td className="px-2 py-2 sm:px-3 sm:py-2.5">
                        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                          <span className="w-9 shrink-0 tabular-nums sm:w-10">{fmt(chest, unit)}</span>
                          <span className="hidden h-1.5 flex-1 overflow-hidden rounded-full bg-[#b79ddb]/20 sm:block">
                            <span
                              className={
                                "block h-full rounded-full bg-gradient-to-r from-[#b79ddb] to-[#7c52b3] transition-all duration-500 " +
                                (active ? "opacity-100" : "opacity-60")
                              }
                              style={{ width: `${(Number(chest) / maxChest) * 100}%` }}
                            />
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-2 tabular-nums sm:px-3 sm:py-2.5">{fmt(length, unit)}</td>
                      <td className="px-2 py-2 tabular-nums sm:px-3 sm:py-2.5">{fmt(sleeve, unit)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
