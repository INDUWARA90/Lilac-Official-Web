import type { Metadata } from "next";
import { SiteFrame } from "@/components/ui/SiteFrame";
import { Prose } from "@/components/ui/Prose";

export const metadata: Metadata = { title: "About us" };

export default function AboutPage() {
  return (
    <SiteFrame>
      <article className="py-12">
        <span className="w-fit rounded-pill bg-accent-wash px-3 py-1 font-sans text-xs font-semibold uppercase tracking-wider text-accent-strong">
          Draft · placeholder copy
        </span>
        <h1 className="mt-4 text-3xl text-ink">About us</h1>
        <p className="mt-3 font-sans text-base leading-relaxed text-ink-muted">
          Lilac is our company&apos;s annual event. This page will introduce the
          event and the team behind it.
        </p>

        <div className="mt-8">
          <Prose>
            <h2>The event</h2>
            <p>
              Placeholder: a short description of what Lilac is, when it takes
              place, and what attendees can expect. Replace with final approved
              copy.
            </p>

            <h2>The draw</h2>
            <p>
              Placeholder: an explanation of how the entry draw works — who can
              enter, how winners are chosen, and how they are contacted. See
              the <a href="/terms">Terms</a> for the formal rules.
            </p>

            <h2>Contact</h2>
            <p>
              Placeholder: how to get in touch. A contact form is available on
              the <a href="/contact">Contact us</a> page.
            </p>
          </Prose>
        </div>

        <p className="mt-12 border-t border-hairline pt-4 font-sans text-xs text-ink-muted">
          This is placeholder text. Final, reviewed copy will replace it before
          launch.
        </p>
      </article>
    </SiteFrame>
  );
}
