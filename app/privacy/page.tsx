import type { Metadata } from "next";
import { SiteFrame } from "@/components/ui/SiteFrame";
import { Prose } from "@/components/ui/Prose";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <SiteFrame>
      <article className="py-12">
        <span className="w-fit rounded-pill bg-accent-wash px-3 py-1 font-sans text-xs font-semibold uppercase tracking-wider text-accent-strong">
          Draft · placeholder copy
        </span>
        <h1 className="mt-4 text-3xl text-ink">Privacy policy</h1>
        <p className="mt-3 font-sans text-base leading-relaxed text-ink-muted">
          How we handle the information you provide when entering the Lilac
          draw. The wording below is a draft outline, not final legal copy.
        </p>

        <div className="mt-8">
          <Prose>
            <h2>What we collect</h2>
            <p>
              When you enter, we collect your name, email address, phone
              number, address, and the demographic details you select. We also
              record when you watched the ad and when you confirmed your
              entry.
            </p>

            <h2>Why we collect it</h2>
            <ul>
              <li>To run the draw and contact you if you win.</li>
              <li>To prevent duplicate entries (one entry per person).</li>
              <li>To understand, in aggregate, how many people entered.</li>
            </ul>

            <h2>What is made public</h2>
            <p>
              <strong>
                If you win, your full name is published on the public results
                page.
              </strong>{" "}
              No other information you provide is shown publicly.
            </p>

            <h2>Retention</h2>
            <p>
              Placeholder: how long entry data is kept and when it is deleted.
            </p>

            <h2>Your choices</h2>
            <p>
              Placeholder: how to request access to, or deletion of, your
              data. Use the <a href="/contact">Contact us</a> form.
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
