import type { Metadata } from "next";
import Link from "next/link";
import { SiteFrame } from "@/components/ui/SiteFrame";
import { Reveal } from "@/components/ui/decor/Reveal";
import { Sparkle } from "@/components/ui/decor/Sparkle";
import { ArtistFrame } from "@/components/ui/decor/ArtistFrame";
import { getPublicArtistRevealVisible } from "@/lib/app-config";
import { ARTIST_LINEUP } from "@/lib/artist-lineup";

export const metadata: Metadata = { title: "About us · Lilac Live in Concert" };

export default async function AboutPage() {
  const artistRevealVisible = await getPublicArtistRevealVisible();

  return (
    <SiteFrame>
      <article className="py-12 sm:py-20">
        
        {/* --- HERO SECTION --- */}
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] border border-[#b79ddb]/30 bg-gradient-to-br from-[#7b539f] via-[#9467c8] to-[#cbb0e9] px-6 py-12 text-white shadow-[0_30px_70px_-25px_rgba(110,80,160,0.5)] sm:px-12 sm:py-16">
            {/* Background Decorative Glows */}
            <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-white/15 blur-2xl" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -left-20 size-72 rounded-full bg-black/10 blur-2xl" />

            <Sparkle size={24} gold className="absolute right-12 top-10" delay={0.2} />
            <Sparkle size={16} className="absolute left-[15%] bottom-8 opacity-80" delay={1.1} />

            <div className="relative z-10 max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-1.5 font-sans text-xs font-semibold uppercase tracking-[0.2em] backdrop-blur">
                <span className="text-[#f3d98a]">🪻</span> A Chapter of Mayathra · Faculty of Technology
              </span>
              <h1 className="mt-5 font-serif text-4xl font-bold tracking-tight sm:text-6xl">
                Lilac Live in Concert
              </h1>
              <p className="mt-4 font-sans text-base leading-relaxed text-white/90 sm:text-lg">
                Proudly presented as a chapter of <strong>Mayathra</strong> and specially organized by the <strong>Faculty of Technology</strong> together with all student batches, welcoming friends from <strong>every faculty across the University of Ruhuna</strong> for an unforgettable calm and relaxed musical experience.
              </p>
            </div>

            {/* Quick Metrics Bar inside Hero */}
            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#f3d98a]">Presented By</span>
                <span className="mt-1 block text-sm font-medium text-white">Mayathra Chapter</span>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#f3d98a]">Organized By</span>
                <span className="mt-1 block text-sm font-medium text-white">Faculty of Technology</span>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#f3d98a]">Community</span>
                <span className="mt-1 block text-sm font-medium text-white">All University Faculties</span>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#f3d98a]">Start Time</span>
                <span className="mt-1 block text-sm font-medium text-white">6:30 PM Onwards</span>
              </div>
            </div>
          </div>
        </Reveal>

        {/* --- WHAT IS LILAC & FACULTY SECTION --- */}
        <Reveal delay={100} className="mt-16">
          <div className="grid gap-8 lg:grid-cols-3 lg:items-center">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-[#7b539f]">Overview</span>
              <h2 className="mt-2 font-serif text-3xl font-bold text-ink">What is Lilac?</h2>
            </div>
            <div className="lg:col-span-2 space-y-4">
              <p className="font-sans text-base leading-relaxed text-ink-muted">
                Lilac isn&apos;t just another concert—it&apos;s a unique, immersive cultural and musical gathering designed with a calm and relaxed vibe, brought to life as a special chapter of <strong>Mayathra</strong> by the <strong>Faculty of Technology</strong> batches.
              </p>
              <p className="font-sans text-base leading-relaxed text-ink-muted">
                While spearheaded by our technology undergraduates, this grand celebration is open to <strong>students across all faculties of the University of Ruhuna</strong>. It stands as a collaborative university-wide festival uniting friends, music lovers, and art enthusiasts under one magical evening.
              </p>
            </div>
          </div>
        </Reveal>

        <section className="relative mt-16 py-2">
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
                <h2 className="lailac-gradient-text mt-3 font-serif text-3xl font-bold sm:text-4xl">
                  Artists coming to the event
                </h2>
                <p className="mx-auto mt-3 max-w-md font-sans text-sm leading-relaxed text-ink-muted">
                  Meet the artists joining us at Lilac concert this year.
                </p>
                <div className="mt-5 flex items-center justify-center gap-3 text-[#a67fd4]" aria-hidden="true">
                  <span className="h-px w-16 bg-gradient-to-r from-transparent to-[#b79ddb]/60" />
                  <span className="text-base">❀</span>
                  <span className="h-px w-16 bg-gradient-to-l from-transparent to-[#b79ddb]/60" />
                </div>
              </div>
            </Reveal>
            <div className="mx-auto mt-10 flex max-w-7xl flex-wrap items-start justify-center gap-y-14 px-2 sm:mt-14 sm:pb-12">
              {ARTIST_LINEUP.map((artist, index) => (
                <div
                  key={artist.id}
                  className={`flex w-full justify-center sm:w-1/3 ${
                    index === 0
                      ? "order-1 sm:order-none"
                      : index === 1
                        ? "order-0 sm:order-none"
                        : "order-2 sm:order-none"
                  }`}
                >
                  <Reveal delay={(index % 3) * 120} className="w-full">
                    <ArtistFrame
                      src={artistRevealVisible ? artist.revealedImageUrl : artist.shadowImageUrl}
                      alt={artistRevealVisible ? artist.name : artist.hiddenName}
                      name={artistRevealVisible ? artist.name : artist.hiddenName}
                      variant={artist.variant}
                      isShadow={!artistRevealVisible}
                      floatDelay={(index % 3) * 1.2}
                      className={index % 3 === 1 ? "sm:translate-y-10" : ""}
                    />
                  </Reveal>
                </div>
              ))}
            </div>
          </section>

        {/* --- EVENT SCHEDULE TIMELINE --- */}
        <Reveal delay={200} className="mt-16">
          <div className="mb-8">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#7b539f]">Timeline</span>
            <h2 className="mt-2 font-serif text-3xl font-bold text-ink">Event Schedule & Plan</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col justify-between rounded-3xl border border-hairline bg-surface p-6 shadow-sm">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#7b539f]">6:30 PM</span>
                <h4 className="mt-2 font-serif text-lg font-bold text-ink">Flute Session</h4>
                <p className="mt-2 text-sm text-ink-muted">A soothing 15-minute introductory flute performance to set the evening tone.</p>
              </div>
              <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-[#7b539f]">Phase 1</div>
            </div>

            <div className="flex flex-col justify-between rounded-3xl border border-hairline bg-surface p-6 shadow-sm">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#7b539f]">6:45 PM – 8:00 PM</span>
                <h4 className="mt-2 font-serif text-lg font-bold text-ink">Acoustic Session</h4>
                <p className="mt-2 text-sm text-ink-muted">Lyrical and acoustic performances by our featured guests.</p>
              </div>
              <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-[#7b539f]">Phase 2</div>
            </div>

            <div className="flex flex-col justify-between rounded-3xl border border-hairline bg-surface p-6 shadow-sm">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#7b539f]">8:00 PM</span>
                <h4 className="mt-2 font-serif text-lg font-bold text-ink">Lantern Festival</h4>
                <p className="mt-2 text-sm text-ink-muted">A breathtaking lighting centerpiece celebrating the night.</p>
              </div>
              <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-[#7b539f]">Phase 3</div>
            </div>

            <div className="flex flex-col justify-between rounded-3xl border border-hairline bg-surface p-6 shadow-sm">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#7b539f]">8:15 PM Onwards</span>
                <h4 className="mt-2 font-serif text-lg font-bold text-ink">Nonstop & Stalls</h4>
                <p className="mt-2 text-sm text-ink-muted">Our headlining act and band take over with nonstop music alongside food stalls.</p>
              </div>
              <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-[#7b539f]">Grand Finale</div>
            </div>
          </div>
        </Reveal>

        {/* --- TICKETS & CONTACT CALLOUTS --- */}
        <Reveal delay={250} className="mt-16">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-hairline bg-surface p-8 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#7b539f]">Admission</span>
              <h3 className="mt-2 font-serif text-2xl font-bold text-ink">Ticket Details</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                Open to all faculties across the University of Ruhuna with two price tiers available. Check batch allocations and secure your passes on our tickets page.
              </p>
              <div className="mt-6">
                <Link
                  href="/tickets"
                  className="inline-flex items-center gap-2 rounded-full bg-[#7b539f] px-6 py-2.5 font-sans text-xs font-semibold uppercase tracking-wider text-white shadow-md transition-all hover:bg-[#5d3a85]"
                >
                  View Tickets →
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-hairline bg-surface p-8 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#7b539f]">Support Us</span>
              <h3 className="mt-2 font-serif text-2xl font-bold text-ink">Get in Touch</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                We look forward to everyone&apos;s support from across all faculties for this Mayathra chapter initiative! Have questions? Reach out to our team directly.
              </p>
              <div className="mt-6">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-full border border-hairline bg-surface px-6 py-2.5 font-sans text-xs font-semibold uppercase tracking-wider text-ink transition-all hover:border-[#7b539f]"
                >
                  Contact Us →
                </Link>
              </div>
            </div>
          </div>
        </Reveal>

        {/* --- FOOTER BANNER --- */}
        <Reveal delay={300}>
          <div className="mt-16 text-center border-t border-hairline pt-8">
            <p className="font-sans text-xs text-ink-muted">
              A special cultural and musical experience presented as a chapter of Mayathra by the Faculty of Technology, brought together by all student batches across the University of Ruhuna. 🪻✨
            </p>
          </div>
        </Reveal>

      </article>
    </SiteFrame>
  );
}