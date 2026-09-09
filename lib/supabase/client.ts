/**
 * Browser (anon) Supabase client.
 *
 * Uses the public anon key. Per the RLS policy in 0001_init.sql this client can
 * do exactly one thing: INSERT a row into `entries`. It cannot read, update, or
 * delete anything.
 *
 * In practice the public form POSTs to /api/entry (server-side zod validation,
 * Turnstile, IP rate-limiting); that route uses this client for the actual
 * insert, so the write stays constrained by RLS even if the route has a bug.
 */
import { createClient } from "@supabase/supabase-js";
import { requirePublic } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

export function createAnonClient() {
  return createClient<Database>(
    requirePublic("supabaseUrl"),
    requirePublic("supabaseAnonKey"),
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
