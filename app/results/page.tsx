import type { Metadata } from "next";
import { SiteFrame } from "@/components/ui/SiteFrame";
import { FlowerDivider } from "@/components/ui/decor/FlowerDivider";
import { Reveal } from "@/components/ui/decor/Reveal";
import { Sparkle } from "@/components/ui/decor/Sparkle";
import { CountUp } from "@/components/ui/decor/CountUp";
import { WinnersConfetti } from "@/components/ui/decor/WinnersConfetti";
import { SectionTitle } from "@/components/ui/decor/SectionTitle";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Results" };

// Was `force-dynamic` (a fresh Supabase round trip on every single visit).
// ISR instead: prerendered, revalidated at most every 30s in the background,
// AND revalidated on demand the moment a draw actually produces winners
// (see revalidatePath("/results") in /api/admin/draw) — so visitors never
// wait more than 30s stale, and never wait on a live query either.
export const revalidate = 30;

export default async function ResultsPage() {
  const db = createAdminClient();

  const [{ count: verifiedCount }, { data: winnerRows }, { data: latestDraw }] =
    await Promise.all([
      db.from("entries").select("*", { count: "exact", head: true }).eq("verified", true),
      db.from("winners").select("entry_id, created_at").order("created_at", { ascending: true }),
      db.from("draws").select("drawn_at").order("drawn_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

  const entryIds = (winnerRows ?? []).map((w) => w.entry_id);
  const { data: winnerEntries } = entryIds.length
    ? await db
        .from("entries")
        .select("id, name")
        .in("id", entryIds)
        .order("name", { ascending: true })
    : { data: [] as { id: string; name: string }[] };

  const hasWinners = (winnerEntries ?? []).length > 0;

  return (
    <SiteFrame>
      <div className="py-12">
        <h1 className="text-3xl text-ink">Results</h1>

        <p className="mt-4 font-sans text-sm text-ink-muted">
          <span className="text-2xl font-semibold text-ink">
            <CountUp value={verifiedCount ?? 0} />
          </span>{" "}
          confirmed entr{verifiedCount === 1 ? "y" : "ies"} in the draw.
        </p>

        <FlowerDivider className="my-8" />

        {hasWinners ? (
          <section>
            <WinnersConfetti />
            <SectionTitle className="text-xl text-ink">Winners</SectionTitle>
            {latestDraw?.drawn_at && (
              <p className="mt-1 font-sans text-xs text-ink-muted">
                Drawn {formatDate(latestDraw.drawn_at)}.
              </p>
            )}
            <ul className="mt-4 flex flex-col gap-2">
              {(winnerEntries ?? []).map((w, i) => (
                <Reveal
                  key={w.id}
                  as="li"
                  delay={i * 80}
                  className={`lilac-magic-card lilac-hover-lift flex items-center gap-2 px-4 py-3 font-sans text-sm text-ink${i === 0 ? " lilac-shine" : ""}`}
                >
                  <Sparkle size={13} gold={i % 3 === 0} />
                  {w.name}
                </Reveal>
              ))}
            </ul>
          </section>
        ) : (
          <p className="font-sans text-sm text-ink-muted">
            Winners will be announced here after the draw. Thank you to everyone
            who has entered.
          </p>
        )}
      </div>
    </SiteFrame>
  );
}
