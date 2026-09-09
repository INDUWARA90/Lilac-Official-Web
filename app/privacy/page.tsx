import type { Metadata } from "next";
import { ContentPage } from "@/components/ui/ContentPage";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <ContentPage
      title="Privacy policy"
      intro="How we handle the information you provide when entering the Lilac draw. The wording below is a draft outline, not final legal copy."
    >
      <h2>What we collect</h2>
      <p>
        When you enter, we collect your name, email address, phone number,
        address, and the demographic details you select. We also record when you
        watched the ad and when you confirmed your entry.
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
          If you win, your full name and ticket code are published on the public
          results page.
        </strong>{" "}
        No other information you provide is shown publicly.
      </p>

      <h2>Retention</h2>
      <p>Placeholder: how long entry data is kept and when it is deleted.</p>

      <h2>Your choices</h2>
      <p>
        Placeholder: how to request access to, or deletion of, your data. Use the{" "}
        <a href="/contact">Contact us</a> form.
      </p>
    </ContentPage>
  );
}
