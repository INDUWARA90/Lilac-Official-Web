import type { Metadata } from "next";
import Link from "next/link";
import { SiteFrame } from "@/components/ui/SiteFrame";
import { Reveal } from "@/components/ui/decor/Reveal";
import { Sparkle } from "@/components/ui/decor/Sparkle";

export const metadata: Metadata = { title: "About us · Lilac Live in Concert" };

export default function AboutPage() {
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

        {/* --- ARTIST LINEUP --- */}
        <Reveal delay={150} className="mt-16">
          <div className="mb-8">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#7b539f]">Talent Lineup</span>
            <h2 className="mt-2 font-serif text-3xl font-bold text-ink">Artists & Special Guests</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* MAIN HEADLINER: UVINDU AYSHCHARYA */}
            <div className="relative overflow-hidden rounded-3xl border-2 border-[#7b539f]/40 bg-gradient-to-br from-[#7b539f] to-[#5d3a85] p-8 text-white shadow-xl md:col-span-2">
              <Sparkle size={20} gold className="absolute right-8 top-8" />
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1 font-sans text-xs font-semibold uppercase tracking-wider backdrop-blur text-[#f3d98a]">
                <span>✨</span> Headlining Artist & Singer
              </div>
              <h3 className="mt-4 font-serif text-3xl font-bold tracking-tight sm:text-4xl">Uvindu Ayshcharya</h3>
              <p className="mt-3 max-w-2xl font-sans text-base leading-relaxed text-white/90">
                Driving the core of our musical journey, Uvindu brings his exceptional vocals, powerful acoustic performances, and mastery of the stage to headline the evening and power the nonstop music session alongside the band.
              </p>
            </div>

            {/* CHATHURYA SADABARANA */}
            <div className="rounded-3xl border border-hairline bg-surface p-6 shadow-sm transition-all hover:border-[#7b539f]/50">
              <span className="inline-block rounded-full bg-[#7b539f]/10 px-3 py-1 text-xs font-semibold text-[#7b539f]">Featured Singer & Artist</span>
              <h4 className="mt-3 font-serif text-xl font-bold text-ink">Chathurya Sadabarana</h4>
              <p className="mt-2 text-sm text-ink-muted">
                Brings a captivating vocal presence and soothing musical performances to set the mood for the evening.
              </p>
            </div>

            {/* IMESH SANDEEPA */}
            <div className="rounded-3xl border border-hairline bg-surface p-6 shadow-sm transition-all hover:border-[#7b539f]/50">
              <span className="inline-block rounded-full bg-[#7b539f]/10 px-3 py-1 text-xs font-semibold text-[#7b539f]">Featured Singer & Artist</span>
              <h4 className="mt-3 font-serif text-xl font-bold text-ink">Imesh Sandeepa</h4>
              <p className="mt-2 text-sm text-ink-muted">
                Brings high energy, powerful vocal delivery, and soulful melodies to both the acoustic and nonstop sets.
              </p>
            </div>

            {/* YESHA FERNANDO */}
            <div className="rounded-3xl border border-hairline bg-surface p-6 shadow-sm transition-all hover:border-[#7b539f]/50 md:col-span-2">
              <span className="inline-block rounded-full bg-[#7b539f]/10 px-3 py-1 text-xs font-semibold text-[#7b539f]">Special Guest Author</span>
              <h4 className="mt-3 font-serif text-xl font-bold text-ink">Yesha Fernando</h4>
              <p className="mt-1 text-sm font-medium text-[#7b539f]">Renowned Author</p>
              <p className="mt-2 text-sm text-ink-muted">
                Author of acclaimed literary works including *Lilac, Lilac, Floramar, and Peppermint*.
              </p>
            </div>
          </div>
          <p className="mt-4 text-center text-xs italic text-ink-muted">
            (This lineup features top artists who regularly headline major evening concerts. It is a fantastic opportunity for our Mayathra chapter event 🫶🏻)
          </p>
        </Reveal>

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
                <p className="mt-2 text-sm text-ink-muted">Lyrical and acoustic performances featuring Yesha, Imesh, and Chathurya.</p>
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
                <p className="mt-2 text-sm text-ink-muted">Uvindu, Imesh, and the band take over with nonstop music alongside food stalls.</p>
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