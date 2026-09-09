import type { Metadata } from "next";
import { SiteFrame } from "@/components/ui/SiteFrame";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = { title: "Contact us" };

export default function ContactPage() {
  return (
    <SiteFrame>
      <div className="py-12">
        <h1 className="text-3xl text-ink">Contact us</h1>
        <p className="mt-3 font-sans text-base leading-relaxed text-ink-muted">
          Questions about the Lilac draw or your entry? Send us a message and
          we&rsquo;ll reply by email.
        </p>

        <div className="mt-8">
          <ContactForm />
        </div>
      </div>
    </SiteFrame>
  );
}
