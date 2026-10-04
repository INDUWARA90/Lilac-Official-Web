import Image from "next/image";

export function MayathraLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`group relative h-full w-full ${className}`}>
      {/* soft breathing glow */}
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-[8%] rounded-full bg-[radial-gradient(circle,rgba(190,160,235,0.55),transparent_70%)] blur-xl transition-opacity duration-500 motion-safe:animate-[pulse_6s_ease-in-out_infinite] group-hover:opacity-100"
      />

      {/* outer dashed ring: slowly orbits, with a small gem riding on it */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-full border border-dashed border-[#b79ddb]/45 transition-colors duration-500 group-hover:border-[#9467c8]/70 motion-safe:animate-[spin_40s_linear_infinite]"
      >
        <span className="absolute left-1/2 top-0 size-1.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-[#9467c8] bg-[#e2d4f3]" />
        <span className="absolute bottom-0 left-1/2 size-1 -translate-x-1/2 translate-y-1/2 rounded-full bg-[#9467c8]/70" />
      </span>

      {/* middle solid hairline ring */}
      <span
        aria-hidden
        className="absolute inset-[5%] rounded-full border border-[#b79ddb]/60 transition-all duration-500 group-hover:inset-[4%] group-hover:border-[#9467c8]/80"
      />

      {/* inner counter-rotating dotted ring */}
      <span
        aria-hidden
        className="absolute inset-[9%] rounded-full border border-dotted border-[#b79ddb]/40 motion-safe:animate-[spin_60s_linear_infinite] [animation-direction:reverse]"
      />

      {/* photo */}
      <div className="absolute inset-[12%] overflow-hidden rounded-full bg-white shadow-[0_18px_36px_-14px_rgba(110,80,160,0.6),0_0_0_3px_#fff,0_0_0_4px_rgba(183,157,219,0.5)] transition-shadow duration-500 group-hover:shadow-[0_24px_44px_-14px_rgba(110,80,160,0.75),0_0_0_3px_#fff,0_0_0_4px_rgba(148,103,200,0.75)]">
        <Image
          src="/mayathra.png"
          alt="Mayathra logo"
          width={400}
          height={400}
          priority
          className="h-full w-full scale-[1.85] object-contain transition-transform duration-700 ease-out group-hover:scale-[1.92]"
        />
        {/* gentle lilac wash */}
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[#7c52b3]/10 via-transparent to-white/20" />
        {/* light sweep on hover */}
        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/45 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-full" />
      </div>

      {/* sparkles */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-0.5 top-[6%] text-[10px] leading-none text-[#c9a227] motion-safe:animate-pulse"
      >
        ✦
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-[8%] -left-0.5 text-[8px] leading-none text-[#a67fd4] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      >
        ✦
      </span>
    </div>
  );
}