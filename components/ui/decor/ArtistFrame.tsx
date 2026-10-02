import { useId, type CSSProperties, type ReactNode } from "react";

type Variant = "lavender" | "gypsophila" | "clematis";

const INK = "#4a4552";
const PURPLE = "#9467c8";
const DEEP = "#7c52b3";
const SOFT = "#e2d4f3";

type Ids = { petal: string; petalTint: string; bud: string; leaf: string };

/* Photo shape + position per variant */
const PHOTO: Record<Variant, { radius: string; inset: string; ring: string }> = {
  lavender: {
    radius: "42% 58% 55% 45% / 38% 45% 55% 62%",
    inset: "inset-[11%]",
    ring: "42% 58% 55% 45% / 38% 45% 55% 62%",
  },
  gypsophila: {
    radius: "50%",
    inset: "inset-x-[16%] inset-y-[10%]",
    ring: "50%",
  },
  clematis: {
    radius: "56% 44% 50% 50% / 50% 56% 44% 50%",
    inset: "inset-[11%]",
    ring: "56% 44% 50% 50% / 50% 56% 44% 50%",
  },
};

/* ---------- Shared gradient defs ---------- */
function Defs({ ids }: { ids: Ids }) {
  return (
    <defs>
      <radialGradient id={ids.petal} cx="50%" cy="85%" r="95%">
        <stop offset="0%" stopColor="#e9dcf7" />
        <stop offset="55%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#ffffff" />
      </radialGradient>
      <radialGradient id={ids.petalTint} cx="50%" cy="85%" r="95%">
        <stop offset="0%" stopColor="#a67fd4" />
        <stop offset="45%" stopColor="#d3bdee" />
        <stop offset="100%" stopColor="#f3ebfb" />
      </radialGradient>
      <linearGradient id={ids.bud} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#d9c6f0" />
      </linearGradient>
      <linearGradient id={ids.leaf} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#ece4f6" />
      </linearGradient>
    </defs>
  );
}

/* ---------- Lavender ---------- */
function LavenderBud({ x, side, k, tint }: { x: number; side: 1 | -1; k: number; tint: boolean }) {
  return (
    <path
      transform={`translate(${x} 0) rotate(${side * 42}) scale(${k})`}
      d="M0 0 C2 -3 8 -4 13 0 C8 4 2 3 0 0Z"
      fill={tint ? "#cdb4ea" : "#fff"}
      stroke={INK}
      strokeWidth={0.8}
    />
  );
}

function Lavender({
  x,
  y,
  rotate,
  length = 120,
  ids,
}: {
  x: number;
  y: number;
  rotate: number;
  length?: number;
  ids: Ids;
}) {
  const buds = Math.floor((length - 18) / 8);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`} strokeLinecap="round" strokeLinejoin="round">
      {/* stem */}
      <path d={`M-18 0 L${length} 0`} stroke={INK} strokeWidth={0.9} fill="none" />
      {/* base leaf pair */}
      <path d="M-4 0 C6 -9 18 -10 28 -6 C18 -2 8 0 -4 0Z" fill={`url(#${ids.leaf})`} stroke={INK} strokeWidth={0.7} />
      {/* buds */}
      {Array.from({ length: buds }).map((_, i) => {
        const px = 14 + i * 8;
        const k = 1.05 - (i / buds) * 0.45;
        const tint = i % 3 === 1;
        return (
          <g key={i}>
            <LavenderBud x={px} side={1} k={k} tint={tint} />
            <LavenderBud x={px} side={-1} k={k} tint={!tint} />
          </g>
        );
      })}
      {/* tip */}
      <path
        d={`M${length - 2} 0 C${length + 2} -3 ${length + 9} -2.5 ${length + 11} 0 C${length + 9} 2.5 ${length + 2} 3 ${length - 2} 0Z`}
        fill={SOFT}
        stroke={INK}
        strokeWidth={0.8}
      />
    </g>
  );
}

function LavenderArt({ ids }: { ids: Ids }) {
  return (
    <>
      {/* top-left spray */}
      <Lavender x={30} y={140} rotate={-50} length={140} ids={ids} />
      <Lavender x={44} y={154} rotate={-64} length={112} ids={ids} />
      <Lavender x={26} y={128} rotate={-34} length={96} ids={ids} />
      {/* bottom-right spray */}
      <Lavender x={92} y={290} rotate={-42} length={146} ids={ids} />
      <Lavender x={120} y={296} rotate={-28} length={116} ids={ids} />
      <Lavender x={74} y={282} rotate={-56} length={96} ids={ids} />
      {/* scattered petals */}
      <circle cx={262} cy={86} r={2.2} fill={PURPLE} opacity={0.7} />
      <circle cx={274} cy={104} r={1.6} fill={PURPLE} opacity={0.5} />
      <circle cx={40} cy={232} r={1.8} fill={PURPLE} opacity={0.5} />
    </>
  );
}

/* ---------- Gypsophila ---------- */
function Blossom({ cx, cy, purple, r = 3 }: { cx: number; cy: number; purple?: boolean; r?: number }) {
  return purple ? (
    <g>
      <circle cx={cx} cy={cy} r={r * 0.85} fill={PURPLE} />
      <circle cx={cx} cy={cy} r={r * 0.3} fill="#f6efc9" />
    </g>
  ) : (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#fff" stroke={INK} strokeWidth={0.75} />
      <circle cx={cx} cy={cy} r={r * 0.3} fill="#e9dfc0" />
    </g>
  );
}

function Twig({
  x,
  y,
  rotate,
  len = 24,
  purple,
}: {
  x: number;
  y: number;
  rotate: number;
  len?: number;
  purple?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`} stroke={INK} strokeWidth={0.75} strokeLinecap="round" fill="none">
      <path d={`M0 0 L${len} 0 M${len * 0.5} 0 L${len * 0.8} -10 M${len * 0.36} 0 L${len * 0.7} 9 M${len * 0.8} -10 L${len * 0.98} -15`} />
      <Blossom cx={len} cy={0} purple={purple} />
      <Blossom cx={len * 0.8} cy={-10} r={2.6} />
      <Blossom cx={len * 0.7} cy={9} purple={!purple} r={2.6} />
      <Blossom cx={len * 0.98} cy={-15} r={2} purple={purple} />
    </g>
  );
}

const TWIGS: [number, number, number, boolean?][] = [
  [90, 262, 148, true],
  [70, 240, 164],
  [54, 212, 176, true],
  [44, 182, 186],
  [40, 150, 194, true],
  [42, 118, 204],
  [52, 90, 216, true],
  [68, 66, 232],
  [92, 48, 250, true],
];

function GypsophilaSide() {
  return (
    <g>
      <path d="M96 270 C36 236 24 120 90 40" stroke={INK} strokeWidth={0.95} fill="none" strokeLinecap="round" />
      {TWIGS.map(([x, y, r, p], i) => (
        <g key={i}>
          <Twig x={x} y={y} rotate={r} purple={p} />
          <Twig x={x} y={y} rotate={r - 40} len={18} purple={!p} />
          <Twig x={x} y={y} rotate={r + 32} len={13} purple={p} />
        </g>
      ))}
    </g>
  );
}

function GypsophilaArt() {
  return (
    <>
      <GypsophilaSide />
      <g transform="translate(300 0) scale(-1 1)">
        <GypsophilaSide />
      </g>
    </>
  );
}

/* ---------- Clematis ---------- */
function Clematis({
  x,
  y,
  r = 0,
  s = 1,
  tint,
  ids,
}: {
  x: number;
  y: number;
  r?: number;
  s?: number;
  tint?: boolean;
  ids: Ids;
}) {
  const petals = [0, 60, 120, 180, 240, 300];
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} stroke={INK} strokeWidth={0.85} strokeLinejoin="round">
      {/* back petals (offset) */}
      {petals.map((a) => (
        <path
          key={`b${a}`}
          transform={`rotate(${a + 30}) scale(0.82)`}
          d="M0 0 C-7 -8 -7 -22 0 -32 C7 -22 7 -8 0 0Z"
          fill={`url(#${tint ? ids.petalTint : ids.petal})`}
          opacity={0.9}
        />
      ))}
      {/* front petals */}
      {petals.map((a) => (
        <g key={a} transform={`rotate(${a})`}>
          <path
            d="M0 0 C-9 -8 -9 -24 0 -36 C9 -24 9 -8 0 0Z"
            fill={`url(#${tint ? ids.petalTint : ids.petal})`}
          />
          <path d="M0 -4 C-1 -14 -1 -24 0 -31" stroke={tint ? DEEP : "#c3b9d2"} strokeWidth={0.55} fill="none" />
          <path d="M-2 -8 C-4 -15 -4 -21 -2 -26 M2 -8 C4 -15 4 -21 2 -26" stroke="#d6cce3" strokeWidth={0.4} fill="none" />
        </g>
      ))}
      {/* stamens */}
      <g stroke={PURPLE} strokeWidth={0.7} strokeLinecap="round">
        {Array.from({ length: 12 }).map((_, i) => (
          <g key={i} transform={`rotate(${i * 30})`}>
            <path d="M0 0 L0 -9" />
            <circle cy={-9.6} r={0.9} fill="#efe3b0" stroke="none" />
          </g>
        ))}
      </g>
      <circle r={2.8} fill="#f3e8b8" stroke={INK} strokeWidth={0.6} />
    </g>
  );
}

function Bud({ x, y, r, s = 1, ids }: { x: number; y: number; r: number; s?: number; ids: Ids }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} stroke={INK} strokeWidth={0.85} strokeLinejoin="round">
      <path d="M0 0 C-6 -6 -5 -18 0 -26 C5 -18 6 -6 0 0Z" fill={`url(#${ids.bud})`} />
      <path d="M0 -3 C-1 -10 -1 -18 0 -23" stroke={PURPLE} strokeWidth={0.5} fill="none" />
      <path d="M-4 2 C-3 -4 3 -4 4 2" fill="none" />
    </g>
  );
}

function Leaf({ x, y, r, s = 1, ids }: { x: number; y: number; r: number; s?: number; ids: Ids }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} stroke={INK} strokeWidth={0.8} strokeLinejoin="round">
      <path d="M0 0 C7 -8 20 -9 30 0 C20 9 7 8 0 0Z" fill={`url(#${ids.leaf})`} />
      <path d="M2 0 L27 0" strokeWidth={0.55} />
      <path d="M9 0 L15 -4 M9 0 L15 4 M17 0 L22 -3 M17 0 L22 3" strokeWidth={0.45} fill="none" />
    </g>
  );
}

function Tendril({ d }: { d: string }) {
  return <path d={d} stroke={INK} strokeWidth={0.7} strokeLinecap="round" fill="none" />;
}

function ClematisArt({ ids }: { ids: Ids }) {
  return (
    <>
      {/* bottom-left cluster */}
      <path d="M36 186 C42 248 104 270 166 256" stroke={INK} strokeWidth={0.95} fill="none" strokeLinecap="round" />
      <Tendril d="M26 214 C14 218 12 232 22 236 C30 238 32 230 27 228" />
      <Leaf x={66} y={262} r={22} ids={ids} />
      <Leaf x={112} y={268} r={-14} s={0.95} ids={ids} />
      <Leaf x={150} y={262} r={-30} s={0.8} ids={ids} />
      <Bud x={26} y={172} r={-14} ids={ids} />
      <Bud x={142} y={258} r={82} s={0.9} ids={ids} />
      <Clematis x={46} y={218} r={10} s={1} tint ids={ids} />
      <Clematis x={92} y={248} r={-8} s={0.88} ids={ids} />

      {/* top-right cluster */}
      <path d="M166 58 C228 34 276 88 262 156" stroke={INK} strokeWidth={0.95} fill="none" strokeLinecap="round" />
      <Tendril d="M272 70 C288 66 294 82 284 88 C277 92 272 86 276 82" />
      <Leaf x={172} y={56} r={-28} s={0.95} ids={ids} />
      <Leaf x={238} y={40} r={-60} s={0.8} ids={ids} />
      <Bud x={266} y={176} r={172} ids={ids} />
      <Bud x={196} y={40} r={-70} s={0.7} ids={ids} />
      <Clematis x={214} y={66} r={-10} s={1} tint ids={ids} />
      <Clematis x={252} y={106} r={15} s={0.88} ids={ids} />
      <Clematis x={240} y={146} r={5} s={0.66} tint ids={ids} />
    </>
  );
}

/* ---------- Public component ---------- */
export function ArtistFrame({
  src,
  alt,
  variant,
  className = "",
  floatDelay = 0,
  name,
}: {
  src: string;
  alt: string;
  variant: Variant;
  className?: string;
  floatDelay?: number;
  name?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const ids: Ids = {
    petal: `${uid}-petal`,
    petalTint: `${uid}-petalTint`,
    bud: `${uid}-bud`,
    leaf: `${uid}-leaf`,
  };
  const { radius, inset, ring } = PHOTO[variant];

  const art: Record<Variant, ReactNode> = {
    lavender: <LavenderArt ids={ids} />,
    gypsophila: <GypsophilaArt />,
    clematis: <ClematisArt ids={ids} />,
  };

  return (
    <figure className={`group mx-auto w-full max-w-[480px] ${className}`}>
      <div className="relative aspect-square w-full transition-transform duration-500 ease-out hover:-translate-y-1.5">
        <div
          className="artist-float absolute inset-0"
          style={{ "--float-delay": `${floatDelay}s` } as CSSProperties}
        >
          {/* soft lilac glow behind */}
          <div
            aria-hidden="true"
            className="absolute inset-[6%] rounded-full bg-[radial-gradient(circle,rgba(190,160,235,0.4),transparent_70%)] blur-2xl"
          />

          {/* hairline rings offset around the photo */}
          <div className={`absolute ${inset}`} aria-hidden="true">
            <div
              className="absolute -inset-[7px] border border-[#b79ddb]/55"
              style={{ borderRadius: ring }}
            />
            <div
              className="absolute -inset-[14px] border border-dashed border-[#b79ddb]/30"
              style={{ borderRadius: ring }}
            />
          </div>

          {/* photo */}
          <div
            className={`absolute ${inset} overflow-hidden bg-white shadow-[0_22px_44px_-18px_rgba(110,80,160,0.6),0_0_0_4px_#fff]`}
            style={{ borderRadius: radius }}
          >
            <img
              src={src}
              alt={alt}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.07]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[#7c52b3]/12 via-transparent to-white/20" />
            <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-full" />
          </div>

          {/* florals */}
          <svg
            viewBox="0 0 300 300"
            fill="none"
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full drop-shadow-[0_2px_6px_rgba(124,82,179,0.18)] transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          >
            <Defs ids={ids} />
            {art[variant]}
          </svg>
        </div>
      </div>

      {/* artist name */}
      {name && (
        <figcaption className="-mt-2 px-2 text-center">
          <div
            className="mx-auto mb-2 flex items-center justify-center gap-2 text-[#a67fd4]"
            aria-hidden="true"
          >
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#b79ddb]/70" />
            <span className="text-xs">✦</span>
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-[#b79ddb]/70" />
          </div>
          <h3 className="font-serif text-2xl font-semibold tracking-wide text-ink transition-colors duration-300 group-hover:text-accent-strong sm:text-3xl">
            {name}
          </h3>
        </figcaption>
      )}
    </figure>
  );
}