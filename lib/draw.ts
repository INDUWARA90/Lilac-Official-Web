import { randomInt } from "node:crypto";

/**
 * Pick `count` distinct items from `pool` using a cryptographically secure RNG
 * (`crypto.randomInt`, never `Math.random` — brief requirement).
 *
 * Partial Fisher–Yates shuffle: for each of the first `count` slots, swap in a
 * uniformly random element from the remaining tail. O(count), unbiased.
 */
export function pickRandom<T>(pool: readonly T[], count: number): T[] {
  const arr = [...pool];
  const n = Math.min(count, arr.length);
  for (let i = 0; i < n; i++) {
    const j = i + randomInt(arr.length - i); // uniform in [i, arr.length)
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, n);
}
