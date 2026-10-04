import type { Metadata } from "next";
import Link from "next/link";
import { SiteFrame } from "@/components/ui/SiteFrame";
import { Button } from "@/components/ui/Button";
import { FlowerDivider } from "@/components/ui/decor/FlowerDivider";
import { Reveal } from "@/components/ui/decor/Reveal";
import { Sparkle } from "@/components/ui/decor/Sparkle";
import { CountUp } from "@/components/ui/decor/CountUp";
import { HeroItem, HeroStagger } from "@/components/ui/decor/Hero";
import { Magnetic } from "@/components/ui/decor/Magnetic";
import { Marquee } from "@/components/ui/decor/Marquee";
import { getPublicDrawUnlocked } from "@/lib/app-config";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAvailability } from "@/lib/tickets";
import { ArtistFrame } from "@/components/ui/decor/ArtistFrame";
import { CtaBanner } from "@/components/ui/decor/CtaBanner";

export const metadata: Metadata = {
  title: { absolute: "Lilac — the annual company event" },
};

// Same ISR pattern as /results and /tickets — a cheap, always-fresh-enough
// count without a Supabase round trip on every idle visit.
export const revalidate = 30;

const MARQUEE = [
  "Watch the sponsor films",
  "Enter the draw",
  "Win a prize",
  "Join the event",
  "Exclusive sponsor highlights",
  "Prizes revealed weekly",
  "Secure your ticket today",
  "See you at Lailac",
] as const;

const FEATURED_ARTISTS = [
  {
    name: "Imesh Sandeepa",
    imageUrl: "https://res.cloudinary.com/dkj7pc9xo/image/upload/v1791103924/hiayhtrwwhsqgd0sdfrq.jpg",
    variant: "poppy"
  },
  {
    name: "Uvindu Ayshcharya",
    imageUrl: "https://res.cloudinary.com/dkj7pc9xo/image/upload/v1791105203/lmdbcgn7ko0iddb7jzy8.jpg",
    variant: "gypsophila"
  },
  {
    name: "Chathurya Sandabarana",
    imageUrl: "https://res.cloudinary.com/dkj7pc9xo/image/upload/v1791105074/hf3sgsktnbrs3cjppvne.jpg",
    variant: "clematis"
  },
  {
    name: "Yesha Frenando",
    imageUrl: "https://res.cloudinary.com/dkj7pc9xo/image/upload/v1791105348/a4njnctt48r546bxpsxy.jpg",
    variant: "lavender"
  },
] as const;

export default async function HomePage() {
  const db = createAdminClient();
  const [{ count: verifiedCount }, availability, drawUnlocked] = await Promise.all([
    db.from("entries").select("*", { count: "exact", head: true }).eq("verified", true),
    getAvailability(),
    getPublicDrawUnlocked(),
  ]);

  return (
    <SiteFrame>
      <div className="py-14">
        <HeroStagger className="lilac-float text-center">
          <HeroItem>
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
              The Chapter of event{' '}
              <span lang="si" className="font-sinhala font-normal normal-case tracking-normal text-ink-muted text-lg">
                මායාත්‍ර
              </span>
            </p>
          </HeroItem>
          <HeroItem className="relative mt-4 inline-block">
            <Sparkle size={22} gold className="absolute -top-3 -left-7" delay={0.2} />
            <Sparkle size={16} className="absolute -top-1 -right-6" delay={1.4} />
            <span lang="si" className="font-sinhala lilac-gradient-text text-5xl sm:text-6xl font-bold">
              ලයිලැක්
            </span>
          </HeroItem>
          <HeroItem>
            <p className="mx-auto mt-4 max-w-md font-sans text-base leading-relaxed text-ink-muted">
              Watch this year&rsquo;s sponsor films, enter the draw, and you could be
              one of our winners. It takes about a minute.
            </p>
          </HeroItem>
          <HeroItem className="mt-8 flex flex-wrap justify-center gap-3">
            {drawUnlocked && (
              <Magnetic>
                <Link href="/enter">
                  <Button variant="magic">Enter the draw</Button>
                </Link>
              </Magnetic>
            )}
            <Magnetic>
              <Link href="/tickets">
                <Button variant="magic">Buy event tickets</Button>
              </Link>
            </Magnetic>
            <Magnetic>
              <Link href="/tshirts">
                <Button variant="magic">T-shirt Order</Button>
              </Link>
            </Magnetic>
          </HeroItem>

          {verifiedCount !== null && verifiedCount > 0 && (
            <HeroItem>
              <p className="mt-6 font-sans text-xs text-ink-muted">
                <Sparkle size={11} className="mr-1 inline align-middle" gold />
                <strong className="text-ink"><CountUp value={verifiedCount} /></strong>{" "}
                {verifiedCount === 1 ? "person has" : "people have"} entered so far
              </p>
            </HeroItem>
          )}
        </HeroStagger>

        <div className="mt-10">
          <Marquee items={MARQUEE} />
        </div>

        <FlowerDivider className="my-12" />

        <section className="relative py-2">
          {/* ambient lilac backdrop */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[75%] w-full max-w-5xl -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(190,160,235,0.28),transparent_70%)] blur-3xl"
          />

          <Reveal>
            <div className="relative mx-auto max-w-2xl px-4 text-center">
              <Sparkle size={18} gold className="absolute -top-2 left-[8%]" delay={0.3} />
              <Sparkle size={13} className="absolute top-8 right-[10%]" delay={1.2} />

              <p className="font-sans text-xs font-semibold uppercase tracking-[0.25em] text-ink-muted">
                The lineup
              </p>
              <h2 className="lilac-gradient-text mt-3 font-serif text-3xl font-bold sm:text-4xl">
                Artists coming to the event
              </h2>
              <p className="mx-auto mt-3 max-w-md font-sans text-sm leading-relaxed text-ink-muted">
                Meet the artists joining us at Lailac concert this year.
              </p>

              {/* flourish */}
              <div className="mt-5 flex items-center justify-center gap-3 text-[#a67fd4]" aria-hidden="true">
                <span className="h-px w-16 bg-gradient-to-r from-transparent to-[#b79ddb]/60" />
                <span className="text-base">❀</span>
                <span className="h-px w-16 bg-gradient-to-l from-transparent to-[#b79ddb]/60" />
              </div>
            </div>
          </Reveal>
          <div className="mx-auto mt-10 flex max-w-7xl flex-wrap items-start justify-center gap-y-14 px-2 sm:mt-14 sm:pb-12">
            {FEATURED_ARTISTS.map((artist, i) => (
              <div key={artist.name} className="flex w-full justify-center sm:w-1/3">
                <Reveal delay={(i % 3) * 120} className="w-full">
                  <ArtistFrame
                    src={artist.imageUrl}
                    alt={artist.name}
                    name={artist.name}
                    variant={artist.variant}
                    floatDelay={(i % 3) * 1.2}
                    className={i % 3 === 1 ? "sm:translate-y-10" : ""}
                  />
                </Reveal>
              </div>
            ))}
          </div>
        </section>
        
        <Reveal >
          <CtaBanner
            drawUnlocked={drawUnlocked}
            ticketsOpen={availability.salesOpen && availability.left > 0}
            seatsLeft={availability.left}
          />
        </Reveal>

      </div>
    </SiteFrame>
  );
}
