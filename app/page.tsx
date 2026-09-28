import type { Metadata } from "next";
import Link from "next/link";
import { SiteFrame } from "@/components/ui/SiteFrame";
import { Button } from "@/components/ui/Button";
import { FlowerDivider } from "@/components/ui/decor/FlowerDivider";
import { Reveal } from "@/components/ui/decor/Reveal";
import { Sparkle } from "@/components/ui/decor/Sparkle";
import { CountUp } from "@/components/ui/decor/CountUp";
import { SeatsMeter } from "@/components/ui/decor/SeatsMeter";
import { Faq, type FaqItem } from "@/components/ui/decor/Faq";
import { HeroItem, HeroStagger } from "@/components/ui/decor/Hero";
import { Magnetic } from "@/components/ui/decor/Magnetic";
import { Marquee } from "@/components/ui/decor/Marquee";
import { SectionTitle } from "@/components/ui/decor/SectionTitle";
import { Timeline } from "@/components/ui/decor/Timeline";
import { TiltCard } from "@/components/ui/decor/TiltCard";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAvailability } from "@/lib/tickets";

/**
 * Public landing page. The raffle flow lives at `/enter`; this page is the
 * calm "front door" — hero, live entry count, a few feature cards, then the
 * How it works / Winners blurbs.
 */
export const metadata: Metadata = {
  title: { absolute: "Lilac — the annual company event" },
};

// Same ISR pattern as /results and /tickets — a cheap, always-fresh-enough
// count without a Supabase round trip on every idle visit.
export const revalidate = 30;

const FEATURES = [
  {
    title: "About a minute",
    body: "Watch a short sponsor film, fill in a few fields, and you're done — no account, no waiting.",
    gold: false,
  },
  {
    title: "Counted instantly",
    body: "No email confirmation step. The moment you submit, your entry is in the draw.",
    gold: true,
  },
  {
    title: "Real prizes, published winners",
    body: "Winners are picked at random and their names go up on the results page for everyone to see.",
    gold: false,
  },
] as const;

const MARQUEE = [
  "Watch the sponsor films",
  "Enter the draw",
  "Win a prize",
  "Join the event",
  "See you at Lilac",
] as const;

const STEPS = [
  "Scan the QR code at the event, or tap \u201cEnter the draw\u201d.",
  "Watch the sponsor messages.",
  "Fill in the short entry form \u2014 one entry per person.",
  "Your entry is confirmed straight away.",
] as const;

const FAQ: readonly FaqItem[] = [
  {
    q: "Is entering the draw free?",
    a: "Yes. Watch the sponsor messages, fill in the short form, and your entry is counted straight away.",
  },
  {
    q: "Can I enter more than once?",
    a: "No — it's one entry per person, checked by email address and phone number.",
  },
  {
    q: "How will I know if I've won?",
    a: "Winners are picked at random after entries close and notified by email. Names are also published on the results page.",
  },
  {
    q: "How do I buy an event ticket?",
    a: "Go to Tickets, fill in your details and upload your bank-transfer slip. Once it's confirmed your QR ticket is emailed to you, and you can check its status anytime with your phone or email.",
  },
  {
    q: "Does a ticket also enter me in the draw?",
    a: "No — tickets and the draw are separate. Buying a ticket doesn't add an entry, and entering the draw doesn't get you a ticket.",
  },
];

export default async function HomePage() {
  const db = createAdminClient();
  const [{ count: verifiedCount }, availability] = await Promise.all([
    db.from("entries").select("*", { count: "exact", head: true }).eq("verified", true),
    getAvailability(),
  ]);

  return (
    <SiteFrame>
      <div className="py-14">
        <HeroStagger className="lilac-float text-center">
          <HeroItem>
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
              The annual company event
            </p>
          </HeroItem>
          <HeroItem className="relative mt-4 inline-block">
            <Sparkle size={22} gold className="absolute -top-3 -left-7" delay={0.2} />
            <Sparkle size={16} className="absolute -top-1 -right-6" delay={1.4} />
            <h1 className="lilac-gradient-text text-5xl sm:text-6xl">Lilac</h1>
          </HeroItem>
          <HeroItem>
          <p className="mx-auto mt-4 max-w-md font-sans text-base leading-relaxed text-ink-muted">
            Watch this year&rsquo;s sponsor films, enter the draw, and you could be
            one of our winners. It takes about a minute.
          </p>
          </HeroItem>
          <HeroItem className="mt-8 flex flex-wrap justify-center gap-3">
            <Magnetic>
              <Link href="/enter">
                <Button variant="magic">Enter the draw</Button>
              </Link>
            </Magnetic>
            <Magnetic>
              <Link href="/tickets">
                <Button variant="ghost">Buy event tickets</Button>
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

        <section className="grid gap-4 sm:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 100}>
              <TiltCard className="h-full">
                <div className="lilac-magic-card lilac-hover-lift h-full p-5">
                  <Sparkle size={16} gold={f.gold} />
                  <h3 className="mt-2 font-serif text-base text-ink">{f.title}</h3>
                  <p className="mt-2 font-sans text-sm leading-relaxed text-ink-muted">{f.body}</p>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </section>

        <FlowerDivider className="my-12" />

        <section className="space-y-8">
          <Reveal>
            <div className="lilac-magic-card lilac-hover-lift p-5">
              <SectionTitle className="font-serif text-xl text-ink">How it works</SectionTitle>
              <Timeline steps={STEPS} />
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="lilac-magic-card lilac-hover-lift p-5">
              <SectionTitle className="font-serif text-xl text-ink">Winners</SectionTitle>
              <p className="mt-3 font-sans text-sm leading-relaxed text-ink-muted">
                Winners are drawn after entries close and are notified by email.
                Names are published on the{" "}
                <Link href="/results" className="text-accent-strong underline">
                  results
                </Link>{" "}
                page.
              </p>
            </div>
          </Reveal>

          {availability.salesOpen && availability.left > 0 && (
            <Reveal delay={240}>
              <div className="lilac-magic-card lilac-shine p-5 text-center sm:flex sm:items-center sm:justify-between sm:gap-4 sm:text-left">
                <div>
                  <h2 className="font-serif text-xl text-ink">Coming to the event?</h2>
                  <p className="mt-2 font-sans text-sm leading-relaxed text-ink-muted">
                    Grab a paid ticket for admission — {availability.left} of{" "}
                    {availability.capacity} left. Separate from the raffle, just as easy.
                  </p>
                  <div className="mt-3">
                    <SeatsMeter taken={availability.taken} capacity={availability.capacity} />
                  </div>
                </div>
                <Link href="/tickets" className="mt-4 inline-block shrink-0 sm:mt-0">
                  <Button variant="magic">Buy tickets</Button>
                </Link>
              </div>
            </Reveal>
          )}
        </section>

        <FlowerDivider className="my-12" />

        <section>
          <Reveal>
            <div className="mb-4">
              <SectionTitle className="font-serif text-xl text-ink">Questions</SectionTitle>
            </div>
            <Faq items={FAQ} />
          </Reveal>
        </section>
      </div>
    </SiteFrame>
  );
}
