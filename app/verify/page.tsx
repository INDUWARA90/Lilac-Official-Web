import type { Metadata } from "next";
import Link from "next/link";
import { SiteFrame } from "@/components/ui/SiteFrame";
import { Button } from "@/components/ui/Button";
import { ConfirmEntry } from "@/components/flow/ConfirmEntry";

export const metadata: Metadata = { title: "Confirm your entry" };

// Token comes from the emailed link; never prerender.
export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function VerifyPage({
  searchParams,
}: {
  // Next 16: searchParams is async.
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;
  const value = Array.isArray(token) ? token[0] : token;
  const valid = typeof value === "string" && UUID_RE.test(value);

  return (
    <SiteFrame>
      {valid ? (
        <ConfirmEntry token={value} />
      ) : (
        <section className="flex flex-col items-center gap-6 py-16 text-center">
          <h1 className="text-3xl text-ink">This link is not valid</h1>
          <p className="mx-auto max-w-sm font-sans text-sm leading-relaxed text-ink-muted">
            The confirmation link is missing or malformed. Please open the link
            from your confirmation email exactly as it appears.
          </p>
          <Link href="/">
            <Button variant="ghost">Return to the entry form</Button>
          </Link>
        </section>
      )}
    </SiteFrame>
  );
}
