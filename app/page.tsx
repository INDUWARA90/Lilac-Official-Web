import type { Metadata } from "next";
import Link from "next/link";
import { SiteFrame } from "@/components/ui/SiteFrame";
import { Button } from "@/components/ui/Button";

/**
 * Public landing page. Static — the raffle flow lives at `/enter`.
 */
export const metadata: Metadata = {
  title: { absolute: "Lilac — the annual company event" },
};

export default function HomePage() {
  return (
    <SiteFrame>
      <div className="py-14">
        <section className="text-center">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
            The annual company event
          </p>
          <h1 className="mt-4 text-4xl text-ink">Lilac</h1>
          <p className="mx-auto mt-4 max-w-md font-sans text-base leading-relaxed text-ink-muted">
            Watch this year&rsquo;s sponsor films, enter the draw, and you could be
            one of our winners. It takes about a minute.
          </p>
          <div className="mt-8 flex justify-center">
            <Link href="/enter">
              <Button>Enter the draw</Button>
            </Link>
          </div>
        </section>

        <hr className="my-12 border-hairline" />

        <section className="space-y-8">
          <div>
            <h2 className="font-serif text-xl text-ink">How it works</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 font-sans text-sm leading-relaxed text-ink-muted">
              <li>Scan the QR code at the event, or tap &ldquo;Enter the draw&rdquo;.</li>
              <li>Watch the sponsor messages.</li>
              <li>Fill in the short entry form — one entry per person.</li>
              <li>Your entry is confirmed straight away.</li>
            </ol>
          </div>

          <div>
            <h2 className="font-serif text-xl text-ink">Winners</h2>
            <p className="mt-3 font-sans text-sm leading-relaxed text-ink-muted">
              Winners are drawn after entries close and are notified by email.
              Names are published on the{" "}
              <Link href="/results" className="text-accent-strong underline">
                results
              </Link>{" "}
              page.
            </p>
          </div>
        </section>
      </div>
    </SiteFrame>
  );
}
