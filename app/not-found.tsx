import Link from "next/link";
import { SiteFrame } from "@/components/ui/SiteFrame";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <SiteFrame>
      <section className="flex flex-col items-center gap-6 py-24 text-center">
        <h1 className="text-3xl text-ink">Page not found</h1>
        <p className="max-w-sm font-sans text-sm leading-relaxed text-ink-muted">
          The page you are looking for does not exist or has moved.
        </p>
        <Link href="/">
          <Button variant="ghost">Return home</Button>
        </Link>
      </section>
    </SiteFrame>
  );
}
