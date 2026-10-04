import type { Metadata } from "next";
import { SiteFrame } from "@/components/ui/SiteFrame";
import { TshirtOrderForm } from "@/components/tshirts/TshirtOrderForm";
import { TshirtSizeGuide } from "@/components/tshirts/TshirtSizeGuide";
import { getTshirtSettings } from "@/lib/tshirts";
import { formatLkr } from "@/lib/tickets-shared";
export const metadata: Metadata = { title: "T-shirts" };
export const dynamic = "force-dynamic";
export default async function TshirtsPage() {
  const settings = await getTshirtSettings();
  return <SiteFrame>
    <div className="py-8 sm:py-12">
      <h1 className="text-3xl text-ink sm:text-4xl">Official T-shirt</h1>
      <p className="mt-3 font-sans text-sm text-ink-muted sm:text-base">
        Order your Lilac T-shirt for{" "}
        <strong className="text-ink">{formatLkr(settings.priceLkr)}</strong> each.
      </p>
      <TshirtSizeGuide />
      {settings.salesOpen ? (
        <div className="mx-auto mt-8 max-w-3xl">
          <TshirtOrderForm priceLkr={settings.priceLkr} />
        </div>
      ) : (
        <p className="lilac-magic-card mt-8 p-4 font-sans text-sm text-ink">
          T-shirt orders are currently closed.
        </p>
      )}
    </div></SiteFrame>;
}
