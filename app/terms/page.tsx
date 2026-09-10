import type { Metadata } from "next";
import { ContentPage } from "@/components/ui/ContentPage";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <ContentPage
      title="Terms"
      intro="The rules for entering the Lilac draw. This is a draft outline and is not the final terms."
    >
      <h2>Entry</h2>
      <ul>
        <li>One entry per person, enforced by email address and phone number.</li>
        <li>
          An entry only counts once it has been confirmed via the link in the
          verification email.
        </li>
        <li>Entries must be submitted before the closing date.</li>
      </ul>

      <h2>The draw</h2>
      <p>
        Winners are selected at random from confirmed entries after entries
        close. The number of winners is decided by the organisers.
      </p>

      <h2>Winners</h2>
      <ul>
        <li>
          <strong>
            Winners&rsquo; full names are published on the public results page.
          </strong>
        </li>
        <li>Winners are also notified by email.</li>
      </ul>

      <h2>Other</h2>
      <p>
        Placeholder: prize details, eligibility, disqualification, and the
        organisers&rsquo; right to amend these terms. Final wording to follow.
      </p>
    </ContentPage>
  );
}
