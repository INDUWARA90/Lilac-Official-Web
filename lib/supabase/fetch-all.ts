const PAGE_SIZE = 1000;

/**
 * Read every row of a query, not just the first page. PostgREST (Supabase)
 * silently caps a plain `select()` at 1000 rows — no error, just a truncated
 * result — which for the draw pool, CSV exports and revenue totals would mean
 * quietly wrong answers once an event passes 1000 rows.
 *
 * `page` must build the query with a stable `.order()` (e.g. by `id`), so rows
 * don't shift between pages, and finish with `.range(from, to)`:
 *
 *   fetchAll((from, to) =>
 *     db.from("entries").select("id").eq("verified", true).order("id").range(from, to),
 *   )
 */
export async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<{ data: T[]; error: unknown }> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) return { data: rows, error };
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return { data: rows, error: null };
}
