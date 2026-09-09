import "server-only";

/**
 * Service-role Supabase client. SERVER ONLY (the `server-only` import fails the
 * build if this is pulled into a client bundle).
 *
 * Uses the service-role key and therefore BYPASSES Row Level Security. Every
 * admin read/write (dashboard, draws, winners, CSV export) and every public
 * aggregate query (results winners list, live entry count) goes through here —
 * inside API routes / server components only.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requirePublic, requireServer, serverEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

let cached: SupabaseClient<Database> | null = null;

export function createAdminClient(): SupabaseClient<Database> {
  // Reuse one instance per server runtime — the Supabase JS client is a
  // PostgREST wrapper over pooled HTTP, safe under serverless concurrency
  // (we never open a raw `pg` connection).
  if (cached) return cached;
  cached = createClient<Database>(
    requirePublic("supabaseUrl"),
    requireServer("SUPABASE_SERVICE_ROLE_KEY", serverEnv.supabaseServiceRoleKey),
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
  return cached;
}
