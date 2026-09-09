import type { Metadata } from "next";
import { ContentPage } from "@/components/ui/ContentPage";

export const metadata: Metadata = { title: "About us" };

export default function AboutPage() {
  return (
    <ContentPage
      title="About us"
      intro="Lilac is our company's annual event. This page will introduce the event and the team behind it."
    >
      <h2>The event</h2>
      <p>
        Placeholder: a short description of what Lilac is, when it takes place,
        and what attendees can expect. Replace with final approved copy.
      </p>

      <h2>The draw</h2>
      <p>
        Placeholder: an explanation of how the entry draw works — who can enter,
        how winners are chosen, and how they are contacted. See the{" "}
        <a href="/terms">Terms</a> for the formal rules.
      </p>

      <h2>Contact</h2>
      <p>
        Placeholder: how to get in touch. A contact form is available on the{" "}
        <a href="/contact">Contact us</a> page.
      </p>
    </ContentPage>
  );
}
