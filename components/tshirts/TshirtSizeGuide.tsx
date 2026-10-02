const SIZES = [
  ["XS", "46", "66"],
  ["S", "48", "68"],
  ["M", "51", "71"],
  ["L", "54", "74"],
  ["XL", "57", "77"],
  ["XXL", "60", "80"],
  ["XXXL", "63", "83"],
] as const;

/** Replace these standard garment measurements with the supplier's final chart before sales open. */
export function TshirtSizeGuide() {
  return (
    <section className="mt-8 grid gap-6 rounded-card border border-hairline bg-canvas-raised p-5 sm:p-6 md:grid-cols-[0.8fr_1.2fr]">
      <div className="flex flex-col items-center justify-center text-center">
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
          T-shirt preview
        </p>
        <svg
          viewBox="0 0 240 250"
          className="mt-3 h-56 w-auto drop-shadow-sm"
          role="img"
          aria-label="Lilac T-shirt preview"
        >
          <path
            d="M77 35 101 22h38l24 13 48 30-23 39-25-13v132H77V91l-25 13L29 65l48-30Z"
            fill="#bda1de"
            stroke="#684786"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M101 22c0 23 38 23 38 0" fill="#f8f5fa" stroke="#684786" strokeWidth="3" />
          <path d="M77 35 101 55M163 35 139 55" fill="none" stroke="#8d69b5" strokeWidth="2" />
          <text x="120" y="128" textAnchor="middle" fill="#fff" fontFamily="serif" fontSize="24" fontWeight="bold">
            LILAC
          </text>
          <text x="120" y="151" textAnchor="middle" fill="#fff" fontFamily="sans-serif" fontSize="9" letterSpacing="2">
            OFFICIAL 2026
          </text>
        </svg>
        <p className="mt-2 font-sans text-xs text-ink-muted">Design preview — final print may vary slightly.</p>
      </div>

      <div>
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">Size chart</p>
        <h2 className="mt-1 text-2xl text-ink">Find your fit</h2>
        <p className="mt-2 font-sans text-sm leading-relaxed text-ink-muted">
          Measurements are for the garment laid flat, in centimetres. Compare a T-shirt you already own for the best fit.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[300px] border-collapse font-sans text-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-2 py-2 font-semibold">Size</th>
                <th className="px-2 py-2 font-semibold">Chest (cm)</th>
                <th className="px-2 py-2 font-semibold">Length (cm)</th>
              </tr>
            </thead>
            <tbody>
              {SIZES.map(([size, chest, length]) => (
                <tr key={size} className="border-b border-hairline/70 text-ink">
                  <td className="px-2 py-2 font-semibold">{size}</td>
                  <td className="px-2 py-2">{chest}</td>
                  <td className="px-2 py-2">{length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 font-sans text-xs text-ink-muted">Chest is measured across the front, under the arms.</p>
      </div>
    </section>
  );
}
