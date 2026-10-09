import { useId, type ReactNode } from "react";

export type Variant =
  | "lavender"
  | "gypsophila"
  | "clematis"
  | "wisteria"
  | "daisy"
  | "blossom"
  | "poppy";

/** Cycle through these for new artists: VARIANTS[i % VARIANTS.length] */
export const VARIANTS: Variant[] = [
  "lavender",
  "gypsophila",
  "clematis",
  "wisteria",
  "daisy",
  "blossom",
  "poppy",
];

const INK = "#4a4552";
const PURPLE = "#9467c8";
const DEEP = "#7c52b3";
const SOFT = "#e2d4f3";

type Ids = { petal: string; petalTint: string; bud: string; leaf: string };

/* Photo shape + position per variant. `plain` hides the dashed lailac rings
   (used when the artwork draws its own outline ring). */
const PHOTO: Record<
  Variant,
  { radius: string; inset: string; ring: string; plain?: boolean }
> = {
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
  wisteria: {
    radius: "50% 50% 45% 45% / 42% 42% 58% 58%",
    inset: "inset-x-[13%] top-[17%] bottom-[9%]",
    ring: "50% 50% 45% 45% / 42% 42% 58% 58%",
  },
  daisy: {
    radius: "58% 42% 47% 53% / 46% 54% 46% 54%",
    inset: "inset-[12%]",
    ring: "58% 42% 47% 53% / 46% 54% 46% 54%",
  },
  blossom: {
    radius: "48% 52% 58% 42% / 55% 45% 55% 45%",
    inset: "inset-[12%]",
    ring: "48% 52% 58% 42% / 55% 45% 55% 45%",
  },
  poppy: {
    radius: "50%",
    inset: "inset-[13%]",
    ring: "50%",
    plain: true,
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

/* ---------- Shared pieces ---------- */
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
      <path d={`M-18 0 L${length} 0`} stroke={INK} strokeWidth={0.9} fill="none" />
      <path d="M-4 0 C6 -9 18 -10 28 -6 C18 -2 8 0 -4 0Z" fill={`url(#${ids.leaf})`} stroke={INK} strokeWidth={0.7} />
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
      <Lavender x={30} y={140} rotate={-50} length={140} ids={ids} />
      <Lavender x={44} y={154} rotate={-64} length={112} ids={ids} />
      <Lavender x={26} y={128} rotate={-34} length={96} ids={ids} />
      <Lavender x={92} y={290} rotate={-42} length={146} ids={ids} />
      <Lavender x={120} y={296} rotate={-28} length={116} ids={ids} />
      <Lavender x={74} y={282} rotate={-56} length={96} ids={ids} />
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
      {petals.map((a) => (
        <path
          key={`b${a}`}
          transform={`rotate(${a + 30}) scale(0.82)`}
          d="M0 0 C-7 -8 -7 -22 0 -32 C7 -22 7 -8 0 0Z"
          fill={`url(#${tint ? ids.petalTint : ids.petal})`}
          opacity={0.9}
        />
      ))}
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

function ClematisArt({ ids }: { ids: Ids }) {
  return (
    <>
      <path d="M36 186 C42 248 104 270 166 256" stroke={INK} strokeWidth={0.95} fill="none" strokeLinecap="round" />
      <Tendril d="M26 214 C14 218 12 232 22 236 C30 238 32 230 27 228" />
      <Leaf x={66} y={262} r={22} ids={ids} />
      <Leaf x={112} y={268} r={-14} s={0.95} ids={ids} />
      <Leaf x={150} y={262} r={-30} s={0.8} ids={ids} />
      <Bud x={26} y={172} r={-14} ids={ids} />
      <Bud x={142} y={258} r={82} s={0.9} ids={ids} />
      <Clematis x={46} y={218} r={10} s={1} tint ids={ids} />
      <Clematis x={92} y={248} r={-8} s={0.88} ids={ids} />

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

/* ---------- Wisteria ---------- */
function Raceme({ x, y, len, flip = false }: { x: number; y: number; len: number; flip?: boolean }) {
  const n = Math.floor(len / 9);
  const fills = ["#ffffff", "#cdb4ea", "#b896e0"];
  return (
    <g transform={`translate(${x} ${y}) ${flip ? "scale(-1 1)" : ""}`} stroke={INK} strokeWidth={0.7} strokeLinecap="round">
      <path d={`M0 0 C2 ${len * 0.3} -2 ${len * 0.7} 0 ${len}`} fill="none" />
      {Array.from({ length: n }).map((_, i) => {
        const t = i / n;
        const py = 6 + i * 9;
        const spread = (1 - t) * 11 + 1.5;
        const r = 4.4 - t * 2.4;
        return (
          <g key={i}>
            <circle cx={-spread} cy={py} r={r} fill={fills[i % 3]} />
            <circle cx={spread} cy={py + 3} r={r} fill={fills[(i + 1) % 3]} />
            {i % 2 === 0 && <circle cx={0} cy={py + 6} r={r * 0.85} fill={fills[(i + 2) % 3]} />}
          </g>
        );
      })}
      <circle cx={0} cy={len + 3} r={1.8} fill={PURPLE} />
    </g>
  );
}

function WisteriaArt({ ids }: { ids: Ids }) {
  return (
    <>
      <path d="M8 62 C80 30 170 26 292 64" stroke={INK} strokeWidth={1} fill="none" strokeLinecap="round" />
      <Tendril d="M292 64 C300 70 298 82 290 82 C284 82 284 76 288 75" />
      <Leaf x={30} y={52} r={-20} s={0.8} ids={ids} />
      <Leaf x={140} y={32} r={-8} s={0.9} ids={ids} />
      <Leaf x={236} y={46} r={14} s={0.85} ids={ids} />
      <Raceme x={38} y={56} len={62} />
      <Raceme x={78} y={42} len={96} />
      <Raceme x={120} y={34} len={72} flip />
      <Raceme x={168} y={32} len={104} />
      <Raceme x={214} y={40} len={80} flip />
      <Raceme x={256} y={52} len={64} />
      <circle cx={24} cy={170} r={2} fill={PURPLE} opacity={0.6} />
      <circle cx={278} cy={176} r={2.2} fill={PURPLE} opacity={0.55} />
      <circle cx={268} cy={214} r={1.6} fill={PURPLE} opacity={0.45} />
    </>
  );
}

/* ---------- Daisy ---------- */
function Daisy({
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
  const petals = Array.from({ length: 15 }, (_, i) => i * 24);
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} stroke={INK} strokeWidth={0.8} strokeLinejoin="round">
      {petals.map((a) => (
        <g key={a} transform={`rotate(${a})`}>
          <path
            d="M0 -6 C-4.5 -14 -4.5 -25 0 -31 C4.5 -25 4.5 -14 0 -6Z"
            fill={`url(#${tint ? ids.petalTint : ids.petal})`}
          />
          <path d="M0 -9 L0 -25" stroke={tint ? DEEP : "#cfc6dc"} strokeWidth={0.4} fill="none" />
        </g>
      ))}
      <circle r={7} fill="#f3e8b8" />
      <g fill="#d9c27a" stroke="none">
        {[0, 72, 144, 216, 288].map((a) => (
          <circle key={a} cx={3.2 * Math.cos((a * Math.PI) / 180)} cy={3.2 * Math.sin((a * Math.PI) / 180)} r={0.9} />
        ))}
        <circle r={1} />
      </g>
    </g>
  );
}

function DaisyArt({ ids }: { ids: Ids }) {
  return (
    <>
      <path d="M22 150 C20 100 40 70 70 56" stroke={INK} strokeWidth={0.95} fill="none" strokeLinecap="round" />
      <Leaf x={22} y={130} r={-70} s={0.8} ids={ids} />
      <Leaf x={30} y={96} r={-40} s={0.7} ids={ids} />
      <Bud x={18} y={160} r={-8} s={0.8} ids={ids} />
      <Daisy x={52} y={72} r={8} s={0.95} tint ids={ids} />
      <Daisy x={92} y={44} r={-12} s={0.7} ids={ids} />
      <Daisy x={22} y={104} r={20} s={0.55} ids={ids} />

      <path d="M282 150 C284 200 262 236 226 252" stroke={INK} strokeWidth={0.95} fill="none" strokeLinecap="round" />
      <Leaf x={282} y={170} r={110} s={0.8} ids={ids} />
      <Leaf x={270} y={214} r={140} s={0.75} ids={ids} />
      <Leaf x={190} y={262} r={190} s={0.8} ids={ids} />
      <Bud x={284} y={146} r={176} s={0.8} ids={ids} />
      <Daisy x={248} y={232} r={-6} s={1} ids={ids} />
      <Daisy x={206} y={262} r={14} s={0.72} tint ids={ids} />
      <Daisy x={278} y={192} r={4} s={0.55} tint ids={ids} />

      <circle cx={150} cy={14} r={1.8} fill={PURPLE} opacity={0.55} />
      <circle cx={146} cy={290} r={1.8} fill={PURPLE} opacity={0.5} />
    </>
  );
}

/* ---------- Cherry blossom ---------- */
function Sakura({
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
  const petals = [0, 72, 144, 216, 288];
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} stroke={INK} strokeWidth={0.8} strokeLinejoin="round">
      {petals.map((a) => (
        <g key={a} transform={`rotate(${a})`}>
          <path
            d="M0 -3 C-10 -8 -11 -21 -4.5 -26 L0 -22 L4.5 -26 C11 -21 10 -8 0 -3Z"
            fill={`url(#${tint ? ids.petalTint : ids.petal})`}
          />
          <path d="M0 -8 L0 -19" stroke={tint ? DEEP : "#cfc6dc"} strokeWidth={0.45} fill="none" />
        </g>
      ))}
      <g stroke={PURPLE} strokeWidth={0.6} strokeLinecap="round">
        {Array.from({ length: 10 }).map((_, i) => (
          <g key={i} transform={`rotate(${i * 36 + 10})`}>
            <path d="M0 0 L0 -8" />
            <circle cy={-8.6} r={0.8} fill="#efe3b0" stroke="none" />
          </g>
        ))}
      </g>
      <circle r={2.4} fill="#f3e8b8" stroke={INK} strokeWidth={0.5} />
    </g>
  );
}

function FallingPetal({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <ellipse
      cx={x}
      cy={y}
      rx={3.4}
      ry={1.9}
      transform={`rotate(${r} ${x} ${y})`}
      fill={SOFT}
      stroke={INK}
      strokeWidth={0.5}
    />
  );
}

function BlossomArt({ ids }: { ids: Ids }) {
  return (
    <>
      <path d="M-4 124 C30 98 52 72 96 54 C120 44 140 40 164 30" stroke={INK} strokeWidth={1} fill="none" strokeLinecap="round" />
      <Tendril d="M60 80 C56 66 66 58 74 62" />
      <Leaf x={100} y={68} r={-28} s={0.7} ids={ids} />
      <Leaf x={56} y={94} r={40} s={0.6} ids={ids} />
      <Bud x={152} y={34} r={62} s={0.8} ids={ids} />
      <Bud x={14} y={122} r={-100} s={0.7} ids={ids} />
      <Sakura x={40} y={106} r={10} s={0.95} tint ids={ids} />
      <Sakura x={86} y={62} r={-14} s={0.85} ids={ids} />
      <Sakura x={128} y={44} r={22} s={0.68} tint ids={ids} />

      <path d="M304 176 C270 202 248 228 204 246 C180 256 160 260 136 270" stroke={INK} strokeWidth={1} fill="none" strokeLinecap="round" />
      <Tendril d="M240 222 C246 236 236 244 228 240" />
      <Leaf x={200} y={232} r={150} s={0.7} ids={ids} />
      <Leaf x={246} y={206} r={220} s={0.6} ids={ids} />
      <Bud x={148} y={266} r={-118} s={0.8} ids={ids} />
      <Bud x={288} y={178} r={110} s={0.7} ids={ids} />
      <Sakura x={262} y={196} r={-8} s={0.95} ids={ids} />
      <Sakura x={218} y={238} r={16} s={0.85} tint ids={ids} />
      <Sakura x={176} y={258} r={-20} s={0.68} ids={ids} />

      <FallingPetal x={236} y={64} r={30} />
      <FallingPetal x={266} y={96} r={-20} />
      <FallingPetal x={34} y={214} r={50} />
      <FallingPetal x={64} y={246} r={-30} />
    </>
  );
}

/* ---------- Poppy (fine line art + outline ring) ---------- */
const POPPY_PETAL =
  "M0 0 C-30 -6 -36 -36 -16 -52 C-4 -60 12 -58 21 -46 C36 -28 26 -6 0 0Z";

/* points along the petal edge; contour lines fan out from the base to these */
const POPPY_EDGE: [number, number][] = [
  [-27, -28],
  [-23, -39],
  [-15, -48],
  [-5, -53],
  [6, -53],
  [15, -47],
  [22, -38],
  [26, -26],
  [22, -14],
];

function PoppyPetal({ a, k = 1, tint, ids }: { a: number; k?: number; tint?: boolean; ids: Ids }) {
  return (
    <g transform={`rotate(${a}) scale(${k})`} stroke={INK} strokeWidth={0.85} strokeLinejoin="round" strokeLinecap="round">
      <path d={POPPY_PETAL} fill={`url(#${tint ? ids.petalTint : ids.petal})`} />
      <g fill="none" strokeWidth={0.5}>
        {POPPY_EDGE.map(([ex, ey], i) => (
          <path key={i} d={`M0 0 Q${ex * 0.2} ${ey * 0.65} ${ex * 0.9} ${ey * 0.9}`} />
        ))}
      </g>
    </g>
  );
}

function Poppy({ x, y, r = 0, s = 1, ids }: { x: number; y: number; r?: number; s?: number; ids: Ids }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      {/* back to front so the front petals cover the lines behind them */}
      <PoppyPetal a={-40} k={1} ids={ids} />
      <PoppyPetal a={34} k={0.92} ids={ids} />
      <PoppyPetal a={-12} k={1.04} tint ids={ids} />
      <PoppyPetal a={16} k={0.82} ids={ids} />
    </g>
  );
}

function SprigLeaf({ r, s = 1, ids }: { r: number; s?: number; ids: Ids }) {
  return (
    <g transform={`rotate(${r}) scale(${s})`} stroke={INK} strokeWidth={0.8} strokeLinejoin="round" strokeLinecap="round">
      <path d="M0 0 C-6 -10 -6 -28 0 -44 C6 -28 6 -10 0 0Z" fill={`url(#${ids.leaf})`} />
      <path d="M0 -2 L0 -38" strokeWidth={0.5} fill="none" />
      <path
        d="M0 -10 L-4 -17 M0 -10 L4 -17 M0 -19 L-4.5 -27 M0 -19 L4.5 -27 M0 -28 L-3 -34 M0 -28 L3 -34"
        strokeWidth={0.45}
        fill="none"
      />
    </g>
  );
}

function PoppySprig({ x, y, ids }: { x: number; y: number; ids: Ids }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <SprigLeaf r={-30} s={0.85} ids={ids} />
      <SprigLeaf r={28} s={0.9} ids={ids} />
      <SprigLeaf r={-8} s={1.05} ids={ids} />
      <SprigLeaf r={10} s={0.7} ids={ids} />
    </g>
  );
}

function PoppyPod({
  x,
  y,
  r = 0,
  s = 1,
  crown = false,
  ids,
}: {
  x: number;
  y: number;
  r?: number;
  s?: number;
  crown?: boolean;
  ids: Ids;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} stroke={INK} strokeWidth={0.8} strokeLinejoin="round" strokeLinecap="round">
      {crown && (
        <g fill="none" strokeWidth={0.55}>
          {[-66, -44, -22, 0, 22, 44, 66].map((a) => (
            <path key={a} d="M0 -13 L0 -21" transform={`rotate(${a} 0 -13)`} />
          ))}
        </g>
      )}
      <ellipse rx={9} ry={11.5} fill={`url(#${ids.bud})`} />
      <g fill="none" strokeWidth={0.5}>
        <path d="M0 -11.5 L0 11.5" />
        <path d="M-4.6 -10.4 Q-8.4 0 -4.6 10.4" />
        <path d="M4.6 -10.4 Q8.4 0 4.6 10.4" />
      </g>
      {crown ? (
        <ellipse cy={-12} rx={6} ry={2.2} fill="#fff" />
      ) : (
        <path d="M-5.5 -10 Q0 -17 5.5 -10Z" fill="#fff" />
      )}
    </g>
  );
}

function PoppyArt({ ids }: { ids: Ids }) {
  return (
    <>
      {/* thin outline ring with a gap at the top-left for the flower */}
      <path
        d="M102.4 37.1 A127 127 0 1 1 26 169.5"
        stroke={INK}
        strokeWidth={1.2}
        fill="none"
        strokeLinecap="round"
      />

      {/* stems */}
      <g stroke={INK} strokeWidth={0.95} fill="none" strokeLinecap="round">
        <path d="M36 104 C34 130 30 150 28 172" />
        <path d="M60 112 C56 136 42 156 30 176" />
        <path d="M30 176 C34 150 60 130 78 132" />
        <path d="M96 84 C84 98 66 108 60 112" />
      </g>

      {/* flower, sprig and pods */}
      <PoppySprig x={36} y={106} ids={ids} />
      <PoppyPod x={60} y={100} r={-8} s={0.95} crown ids={ids} />
      <PoppyPod x={80} y={146} r={-14} s={0.95} ids={ids} />
      <Poppy x={98} y={82} r={-50} s={1.1} ids={ids} />
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
  isShadow = false,
}: {
  src: string;
  alt: string;
  variant: Variant;
  className?: string;
  floatDelay?: number;
  name?: string;
  isShadow?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const ids: Ids = {
    petal: `${uid}-petal`,
    petalTint: `${uid}-petalTint`,
    bud: `${uid}-bud`,
    leaf: `${uid}-leaf`,
  };
  const { radius, inset, ring, plain } = PHOTO[variant];

  const art: Record<Variant, ReactNode> = {
    lavender: <LavenderArt ids={ids} />,
    gypsophila: <GypsophilaArt />,
    clematis: <ClematisArt ids={ids} />,
    wisteria: <WisteriaArt ids={ids} />,
    daisy: <DaisyArt ids={ids} />,
    blossom: <BlossomArt ids={ids} />,
    poppy: <PoppyArt ids={ids} />,
  };

  return (
    <figure className={`group mx-auto w-full max-w-[560px] ${className}`}>
      {/* hover lift (outer) */}
      <div className="relative aspect-square w-full transition-transform duration-500 ease-out hover:-translate-y-2">
        {/* idle float (inner) */}
        <div
          className="absolute inset-0 motion-safe:animate-artist-float"
          style={{ animationDelay: `${floatDelay}s` }}
        >
          {/* breathing lailac glow */}
          <div
            aria-hidden="true"
            className="absolute inset-[4%] rounded-full bg-[radial-gradient(circle,rgba(190,160,235,0.45),transparent_70%)] blur-2xl transition-opacity duration-500 motion-safe:animate-[pulse_6s_ease-in-out_infinite] group-hover:opacity-100"
          />

          {/* hairline rings (skipped when the artwork draws its own ring) */}
          {!plain && (
            <div className={`absolute ${inset}`} aria-hidden="true">
              <div
                className="absolute -inset-[7px] border border-[#b79ddb]/55 transition-colors duration-500 group-hover:border-[#9467c8]/80"
                style={{ borderRadius: ring }}
              />
              <div
                className="absolute -inset-[15px] border border-dashed border-[#b79ddb]/30 transition-all duration-700 group-hover:-inset-[19px] group-hover:border-[#b79ddb]/60"
                style={{ borderRadius: ring }}
              />
            </div>
          )}

          {/* photo */}
          <div
            className={`absolute ${inset} overflow-hidden ${
              isShadow ? "bg-[#f0e8f8]" : "bg-white"
            } shadow-[0_24px_48px_-18px_rgba(110,80,160,0.6),0_0_0_4px_#fff,0_0_0_5px_rgba(183,157,219,0.45)] transition-shadow duration-500 group-hover:shadow-[0_32px_60px_-18px_rgba(110,80,160,0.75),0_0_0_4px_#fff,0_0_0_5px_rgba(148,103,200,0.7)]`}
            style={{ borderRadius: radius }}
          >
            <img
              src={src}
              alt={alt}
              loading="lazy"
              decoding="async"
              className={`h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.04] ${
                isShadow
                  ? "object-contain mix-blend-multiply contrast-125"
                  : "object-cover saturate-[0.95] group-hover:saturate-110"
              }`}
            />
            <div
              className={`pointer-events-none absolute inset-0 ${
                isShadow
                  ? "bg-gradient-to-br from-[#9467c8]/10 via-transparent to-[#b79ddb]/20"
                  : "bg-gradient-to-tr from-[#7c52b3]/15 via-transparent to-white/20"
              }`}
            />
            {/* bottom fade for depth */}
            {!isShadow && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#4a2f7a]/20 to-transparent" />
            )}
            {/* light sweep */}
            {!isShadow && (
              <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-full" />
            )}
          </div>

          {/* florals */}
          <svg
            viewBox="0 0 300 300"
            fill="none"
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full drop-shadow-[0_2px_6px_rgba(124,82,179,0.2)] transition-transform duration-700 ease-out group-hover:scale-[1.035] group-hover:rotate-[0.6deg]"
          >
            <Defs ids={ids} />
            {art[variant]}
          </svg>

          {/* sparkles that appear on hover */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-[10%] top-[8%] scale-50 text-lg text-[#c9a227] opacity-0 transition-all duration-500 group-hover:scale-100 group-hover:opacity-100"
          >
            ✦
          </span>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-[14%] left-[8%] scale-50 text-sm text-[#a67fd4] opacity-0 transition-all delay-100 duration-500 group-hover:scale-100 group-hover:opacity-100"
          >
            ✦
          </span>
        </div>
      </div>

      {/* artist name */}
      {name && (
        <figcaption className="relative z-10 mt-3 px-2 text-center sm:mt-5">
          <div
            className="mx-auto mb-2 flex items-center justify-center gap-2 text-[#a67fd4]"
            aria-hidden="true"
          >
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#b79ddb]/70 transition-all duration-500 group-hover:w-14" />
            <span className="text-xs transition-transform duration-500 group-hover:rotate-180">✦</span>
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-[#b79ddb]/70 transition-all duration-500 group-hover:w-14" />
          </div>

          <h3 className="whitespace-nowrap font-serif text-2xl font-semibold tracking-wide text-ink transition-colors duration-300 group-hover:text-accent-strong sm:text-xl md:text-2xl lg:text-3xl">
            {name}
          </h3>
        </figcaption>
      )}
    </figure>
  );
}