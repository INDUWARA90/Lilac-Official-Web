/**
 * Browser (anon) Supabase client.
 *
 * Uses the public anon key. Per the RLS policy in 0001_init.sql, this client
 * can do exactly ONE thing: INSERT a row into `entries`. It cannot read, update,
 * or delete anything, in any table.
 *
 * In practice the public form still POSTs to /api/entry (for server-side zod
 * validation, Turnstile checks, and IP rate-limiting) — this client is the thin
 * DB layer that route uses for the actual insert, so the write is constrained by
 * RLS even if the route has a bug.
 */
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

export function createAnonClient() {
  return createClient<Database>(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
