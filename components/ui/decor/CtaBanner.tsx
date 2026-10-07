import Link from "next/link";
import { Sparkle } from "@/components/ui/decor/Sparkle";
import { Magnetic } from "@/components/ui/decor/Magnetic";

type CtaBannerProps = {
  /** Show the "Enter the draw" button */
  drawUnlocked?: boolean;
  /** Show the "Buy tickets" button */
  ticketsOpen?: boolean;
  /** Show public links to ticket purchases */
  ticketLinksVisible?: boolean;
  /** Seats left, shown as a small note when provided */
  seatsLeft?: number;
  /** Threshold under which the seat counter becomes "urgent" */
  urgencyThreshold?: number;
  className?: string;
};

export function CtaBanner({
  drawUnlocked = false,
  ticketsOpen = true,
  ticketLinksVisible = true,
  seatsLeft,
  urgencyThreshold = 5,
  className = "",
}: CtaBannerProps) {
  const isSoldOut = !ticketsOpen || (typeof seatsLeft === "number" && seatsLeft <= 0);
  const isLowStock = typeof seatsLeft === "number" && seatsLeft > 0 && seatsLeft <= urgencyThreshold;

  return (
    <section
      aria-label="Event Call to Action"
      className={`relative mx-auto w-full max-w-6xl overflow-hidden rounded-[2rem] border border-[#b79ddb]/40 bg-gradient-to-br from-[#7b539f] via-[#9467c8] to-[#cbb0e9] px-6 py-12 text-center text-white shadow-[0_30px_70px_-30px_rgba(110,80,160,0.8)] sm:px-12 sm:py-16 ${className}`}
    >
      {/* Decorative background elements */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-white/15 blur-sm motion-safe:animate-pulse"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-12 size-56 rounded-full bg-white/10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-3 rounded-[1.6rem] border border-dashed border-white/25"
      />

      {/* Sparkle effects */}
      <Sparkle size={22} gold className="absolute left-[10%] top-8" delay={0.2} />
      <Sparkle size={14} className="absolute right-[12%] top-12 opacity-90" delay={1.1} />
      <Sparkle size={16} gold className="absolute bottom-10 right-[18%]" delay={0.7} />

      <div className="relative">
        {/* Status badge */}
        <p className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3.5 py-1 font-sans text-[11px] font-semibold uppercase tracking-[0.22em] backdrop-blur">
          <span className="text-[#f3d98a]">❀</span>
          {isSoldOut ? "Event Sold Out" : "Don't miss it"}
        </p>

        {/* Heading */}
        <h2 className="mt-5 font-serif text-3xl font-bold leading-tight drop-shadow-sm sm:text-5xl">
          {isSoldOut ? "Lailac night is fully booked" : "Be part of the Lailac night"}
        </h2>

        {/* Subtitle description */}
        <p className="mx-auto mt-4 max-w-md font-sans text-sm leading-relaxed text-white/85 sm:text-base">
          {isSoldOut
            ? "Keep an eye out for future announcements or enter the draw below if available."
            : "Grab your ticket for the event, and take a minute to enter the draw for a chance to win a prize."}
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {ticketLinksVisible && !isSoldOut && (
            <Magnetic>
              <Link href="/tickets">
                <span className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-white px-7 py-3 font-sans text-sm font-semibold text-[#5d3a85] shadow-[0_14px_30px_-12px_rgba(0,0,0,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-12px_rgba(0,0,0,0.55)]">
                  Buy event tickets
                  <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#b79ddb]/40 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
                  />
                </span>
              </Link>
            </Magnetic>
          )}

          {drawUnlocked && (
            <Magnetic>
              <Link href="/enter">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/10 px-7 py-3 font-sans text-sm font-semibold text-white backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20">
                  Enter the draw
                </span>
              </Link>
            </Magnetic>
          )}
        </div>

        {/* Dynamic Seats Left Note with Urgency Highlight */}
        {!isSoldOut && typeof seatsLeft === "number" && seatsLeft > 0 && (
          <p
            className={`mt-5 font-sans text-xs tracking-wide transition-colors ${
              isLowStock ? "text-[#f3d98a] font-medium" : "text-white/75"
            }`}
            aria-live="polite"
          >
            {isLowStock ? "⚠️️ Only " : "Only "}
            <strong className="font-semibold text-white">{seatsLeft}</strong>{" "}
            {seatsLeft === 1 ? "seat left" : "seats left"}
          </p>
        )}
      </div>
    </section>
  );
}