import type { Metadata } from "next";
import { SiteFrame } from "@/components/ui/SiteFrame";
import { Prose } from "@/components/ui/Prose";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <SiteFrame>
      <article className="py-12">
        <span className="w-fit rounded-pill bg-accent-wash px-3 py-1 font-sans text-xs font-semibold uppercase tracking-wider text-accent-strong">
          Draft · placeholder copy
        </span>
        <h1 className="mt-4 text-3xl text-ink">Terms</h1>
        <p className="mt-3 font-sans text-base leading-relaxed text-ink-muted">
          The rules for entering the Lilac draw. This is a draft outline and
          is not the final terms.
        </p>

        <div className="mt-8">
          <Prose>
            <h2>Entry</h2>
            <ul>
              <li>
                One entry per person, enforced by email address and phone
                number.
              </li>
              <li>
                An entry only counts once it has been confirmed via the link
                in the verification email.
              </li>
              <li>Entries must be submitted before the closing date.</li>
            </ul>

            <h2>The draw</h2>
            <p>
              Winners are selected at random from confirmed entries after
              entries close. The number of winners is decided by the
              organisers.
            </p>

            <h2>Winners</h2>
            <ul>
              <li>
                <strong>
                  Winners&rsquo; full names are published on the public
                  results page.
                </strong>
              </li>
              <li>Winners are also notified by email.</li>
            </ul>

            <h2>Other</h2>
            <p>
              Placeholder: prize details, eligibility, disqualification, and
              the organisers&rsquo; right to amend these terms. Final wording
              to follow.
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
