import type { Metadata } from "next";
import { SiteFrame } from "@/components/ui/SiteFrame";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = { title: "Contact us" };

export default function ContactPage() {
  return (
    <SiteFrame>
      <div className="py-12">
        <div className="mt-8">
          <ContactForm />
        </div>
      </div>
    </SiteFrame>
  );
}
