import type { Metadata } from "next";
import Link from "next/link";
import { SiteFrame } from "@/components/ui/SiteFrame";
import { Reveal } from "@/components/ui/decor/Reveal";
import { Sparkle } from "@/components/ui/decor/Sparkle";

export const metadata: Metadata = { title: "About us · Lilac Live in Concert" };

export default async function AboutPage() {
  const mainSinger = {
    name: "Uvindu Ayshcharya",
    role: "Main Featured Guest Artist",
    tag: "Headliner",
    description:
      "Bringing an unforgettable live vocal performance as our primary guest artist to anchor the evening.",
  };

  const otherSingers = [
    {
      name: "Imesh Sandeepa",
      role: "Guest Vocalist & Live Act",
      tag: "Featured Vocalist",
      description:
        "Leading both the opening acoustic session and the late-night nonstop music segment alongside the live band.",
    },
    {
      name: "Chathurya Sandabarana",
      role: "Guest Vocalist",
      tag: "Featured Vocalist",
      description:
        "Performing soulful acoustic melodies to create a warm and memorable musical experience.",
    },
  ];

  const author = {
    name: "Yesha Fernando",
    role: "Acclaimed Author & Guest Speaker",
    tag: "Special Guest Author",
    description:
      "Celebrated author of 'Lilac' (ලයිලැක් / ලීලැක්), 'Floramar', and 'Peppermint' (පෙපර් මින්ට්), sharing literary insights and inspirations.",
  };

  return (
    <SiteFrame>
      <article className="py-12 sm:py-20">
        {/* --- HERO SECTION --- */}
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] border border-[#b79ddb]/30 bg-gradient-to-br from-[#7b539f] via-[#9467c8] to-[#cbb0e9] px-6 py-12 text-white shadow-[0_30px_70px_-25px_rgba(110,80,160,0.5)] sm:px-12 sm:py-16">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-white/15 blur-2xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-20 -left-20 size-72 rounded-full bg-black/10 blur-2xl"
            />

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
                Organized together by all student batches of the <strong>Faculty of Technology</strong>, welcoming students and friends from <strong>every faculty across the University of Ruhuna</strong> for an unforgettable calm and relaxed musical experience.
              </p>
            </div>

            {/* Quick Details Bar */}
            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#f3d98a]">Date</span>
                <span className="mt-1 block text-sm font-semibold text-white">October 28</span>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#f3d98a]">Venue</span>
                <span className="mt-1 block text-sm font-semibold text-white">Faculty Ground</span>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#f3d98a]">Time</span>
                <span className="mt-1 block text-sm font-semibold text-white">6:30 PM Onwards</span>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#f3d98a]">Community</span>
                <span className="mt-1 block text-sm font-semibold text-white">All Ruhuna Faculties</span>
              </div>
            </div>
          </div>
        </Reveal>

        {/* --- WHAT IS LILAC SECTION --- */}
        <Reveal delay={100} className="mt-16">
          <div className="grid gap-8 lg:grid-cols-3 lg:items-center">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-[#7b539f]">Overview</span>
              <h2 className="mt-2 font-serif text-3xl font-bold text-ink">What is Lilac?</h2>
            </div>
            <div className="lg:col-span-2 space-y-4">
              <p className="font-sans text-base leading-relaxed text-ink-muted">
                Lilac is a uniquely crafted musical experience designed with a <strong>calm and relaxed vibe</strong>. We are thrilled to bring together popular contemporary vocalists alongside a celebrated author for this special evening.
              </p>
              <p className="font-sans text-base leading-relaxed text-ink-muted">
                This concert isn&apos;t limited to our faculty—it is a campus-wide celebration uniting <strong>students from all faculties across the University of Ruhuna</strong>.
              </p>
            </div>
          </div>
        </Reveal>

        {/* --- SECTION 1: SINGERS LINE-UP --- */}
        <section className="relative mt-20 py-4">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[80%] w-full max-w-5xl -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(190,160,235,0.25),transparent_70%)] blur-3xl"
          />
          <Reveal>
            <div className="relative mx-auto max-w-2xl px-4 text-center">
              <Sparkle size={18} gold className="absolute -top-2 left-[8%]" delay={0.3} />
              <Sparkle size={13} className="absolute top-8 right-[10%]" delay={1.2} />
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7b539f]">
                Musical Performers
              </span>
              <h2 className="mt-2 font-serif text-3xl font-bold text-ink sm:text-4xl">
                Featured Vocalists & Band
              </h2>
              <div className="mt-5 flex items-center justify-center gap-3 text-[#a67fd4]" aria-hidden="true">
                <span className="h-px w-16 bg-gradient-to-r from-transparent to-[#b79ddb]/60" />
                <span className="text-base">❀</span>
                <span className="h-px w-16 bg-gradient-to-l from-transparent to-[#b79ddb]/60" />
              </div>
            </div>
          </Reveal>

          {/* UVINDU AYSHCHARYA - SPOTLIGHT HERO CARD */}
          <div className="mx-auto mt-10 max-w-5xl">
            <Reveal delay={150}>
              <div className="relative overflow-hidden rounded-[2.5rem] border border-[#b79ddb] bg-gradient-to-r from-[#7b539f] via-[#8c5ebc] to-[#a67fd4] p-8 text-white shadow-[0_25px_60px_-20px_rgba(123,83,159,0.45)] sm:p-10">
                <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 size-56 rounded-full bg-white/10 blur-xl" />
                <Sparkle size={22} gold className="absolute right-8 top-8" delay={0.4} />

                <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
                  <div className="max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-[#f3d98a] px-3.5 py-1 font-sans text-[11px] font-bold uppercase tracking-widest text-[#5d3a85] shadow-sm">
                        ⭐ {mainSinger.tag}
                      </span>
                      <span className="text-xs font-medium text-white/80">Headline Vocalist</span>
                    </div>

                    <h3 className="mt-4 font-serif text-3xl font-bold sm:text-4xl">
                      {mainSinger.name}
                    </h3>
                    <p className="mt-1 font-sans text-sm font-semibold tracking-wide text-[#f3d98a]">
                      {mainSinger.role}
                    </p>
                    <p className="mt-3 font-sans text-sm leading-relaxed text-white/90">
                      {mainSinger.description}
                    </p>
                  </div>

                  <div className="shrink-0 rounded-2xl border border-white/25 bg-white/10 px-6 py-4 text-center backdrop-blur md:self-center">
                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#f3d98a]">October 28</span>
                    <span className="mt-1 block font-serif text-base font-bold text-white">Faculty Ground</span>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* OTHER SINGERS GRID */}
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {otherSingers.map((singer, index) => (
                <Reveal key={singer.name} delay={200 + index * 100}>
                  <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[2rem] border border-hairline bg-surface p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#b79ddb]/60 hover:shadow-md">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#7b539f]/10 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#7b539f]">
                          {singer.tag}
                        </span>
                        <span className="text-sm opacity-60">🎵</span>
                      </div>

                      <h3 className="mt-4 font-serif text-xl font-bold text-ink transition-colors group-hover:text-[#7b539f]">
                        {singer.name}
                      </h3>
                      <p className="mt-1 font-sans text-xs font-semibold tracking-wide text-[#7b539f]">
                        {singer.role}
                      </p>
                      <p className="mt-3 text-xs leading-relaxed text-ink-muted">
                        {singer.description}
                      </p>
                    </div>

                    <div className="mt-6 border-t border-[#b79ddb]/20 pt-3 text-[11px] font-medium text-ink-muted">
                      Performing Live at Lilac 🪻
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* --- SECTION 2: FEATURED AUTHOR --- */}
        <section className="relative mt-16 py-4">
          <Reveal>
            <div className="mx-auto max-w-5xl">
              <div className="mb-6 flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-widest text-[#7b539f]">
                  Literary & Special Guest
                </span>
                <span className="h-px flex-1 bg-gradient-to-r from-[#b79ddb]/40 to-transparent" />
              </div>

              <div className="relative overflow-hidden rounded-[2.25rem] border border-[#b79ddb]/40 bg-gradient-to-br from-white via-[#fcf9ff] to-[#f4ecff] p-8 shadow-[0_15px_45px_-20px_rgba(123,83,159,0.2)] sm:p-10">
                <Sparkle size={16} className="absolute right-8 top-8 opacity-75" delay={0.6} />

                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div className="max-w-2xl">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#7b539f]/20 bg-[#7b539f]/10 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#7b539f]">
                      📖 {author.tag}
                    </div>

                    <h3 className="mt-4 font-serif text-2xl font-bold text-ink sm:text-3xl">
                      {author.name}
                    </h3>
                    <p className="mt-1 font-sans text-xs font-semibold tracking-wide text-[#7b539f]">
                      {author.role}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                      {author.description}
                    </p>
                  </div>

                  <div className="shrink-0 rounded-2xl border border-[#b79ddb]/30 bg-white/80 p-5 text-left shadow-sm backdrop-blur">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[#7b539f]">Notable Publications</span>
                    <ul className="mt-2 space-y-1 font-serif text-xs font-medium text-ink">
                      <li>• &lsquo;ලයිලැක්&rsquo; (Lilac) / &lsquo;ලීලැක්&rsquo;</li>
                      <li>• &lsquo;Floramar&rsquo;</li>
                      <li>• &lsquo;පෙපර් මින්ට්&rsquo; (Peppermint)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* --- EVENT SCHEDULE & PLAN --- */}
        <Reveal delay={200} className="mt-20">
          <div className="mb-8">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#7b539f]">Timeline</span>
            <h2 className="mt-2 font-serif text-3xl font-bold text-ink">Event Plan & Highlights</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col justify-between rounded-3xl border border-hairline bg-surface p-6 shadow-sm">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#7b539f]">6:30 PM</span>
                <h4 className="mt-2 font-serif text-lg font-bold text-ink">Flute Session</h4>
                <p className="mt-2 text-sm text-ink-muted">The concert begins with a tranquil 15-minute introductory flute melody.</p>
              </div>
              <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-[#7b539f]">01 · Opening</div>
            </div>

            <div className="flex flex-col justify-between rounded-3xl border border-hairline bg-surface p-6 shadow-sm">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#7b539f]">6:45 PM – 8:00 PM</span>
                <h4 className="mt-2 font-serif text-lg font-bold text-ink">Session One</h4>
                <p className="mt-2 text-sm text-ink-muted">Acoustic and literary guest performances featuring Yesha, Imesh, and Chathurya.</p>
              </div>
              <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-[#7b539f]">02 · Session 1</div>
            </div>

            <div className="flex flex-col justify-between rounded-3xl border border-hairline bg-surface p-6 shadow-sm">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#7b539f]">8:00 PM</span>
                <h4 className="mt-2 font-serif text-lg font-bold text-ink">Lantern Festival</h4>
                <p className="mt-2 text-sm text-ink-muted">A breathtaking sky lantern release lighting up the evening sky.</p>
              </div>
              <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-[#7b539f]">03 · Lanterns</div>
            </div>

            <div className="flex flex-col justify-between rounded-3xl border border-hairline bg-surface p-6 shadow-sm">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#7b539f]">8:15 PM Onwards</span>
                <h4 className="mt-2 font-serif text-lg font-bold text-ink">Nonstop & Stalls</h4>
                <p className="mt-2 text-sm text-ink-muted">High-energy live band performances by Imesh & Uvindu alongside delicious food stalls.</p>
              </div>
              <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-[#7b539f]">04 · Grand Finale</div>
            </div>
          </div>
        </Reveal>

        {/* --- TICKET PRICING & CONTACT CALLOUTS --- */}
        <Reveal delay={250} className="mt-16">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-hairline bg-surface p-8 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#7b539f]">Admission</span>
              <h3 className="mt-2 font-serif text-2xl font-bold text-ink">Ticket Pricing</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                Open to students and friends across all faculties of the University of Ruhuna. Passes are available in two categories:
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <div className="rounded-2xl border border-[#b79ddb]/30 bg-[#7b539f]/5 px-4 py-2 text-sm font-semibold text-ink">
                  Standing — <span className="text-[#7b539f]">Rs. 300</span>
                </div>
                <div className="rounded-2xl border border-[#b79ddb]/30 bg-[#7b539f]/5 px-4 py-2 text-sm font-semibold text-ink">
                  Seating — <span className="text-[#7b539f]">Rs. 500</span>
                </div>
              </div>
              <div className="mt-6">
                <Link
                  href="/tickets"
                  className="inline-flex items-center gap-2 rounded-full bg-[#7b539f] px-6 py-2.5 font-sans text-xs font-semibold uppercase tracking-wider text-white shadow-md transition-all hover:bg-[#5d3a85]"
                >
                  Buy Tickets Now →
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-hairline bg-surface p-8 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#7b539f]">Attractions</span>
              <h3 className="mt-2 font-serif text-2xl font-bold text-ink">Food Stalls & Activities</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                In addition to the live music, enjoy a variety of food stalls and exciting interactive side-events throughout the night!
              </p>
              <div className="mt-6">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-full border border-hairline bg-surface px-6 py-2.5 font-sans text-xs font-semibold uppercase tracking-wider text-ink transition-all hover:border-[#7b539f]"
                >
                  Contact Organizing Team →
                </Link>
              </div>
            </div>
          </div>
        </Reveal>

        {/* --- FOOTER BANNER --- */}
        <Reveal delay={300}>
          <div className="mt-16 text-center border-t border-hairline pt-8">
            <p className="font-sans text-xs text-ink-muted">
              📅 October 28 · 📍 Faculty Ground · ⏰ 6:30 PM Onwards · Faculty of Technology, University of Ruhuna 🪻✨
            </p>
          </div>
        </Reveal>
      </article>
    </SiteFrame>
  );
}