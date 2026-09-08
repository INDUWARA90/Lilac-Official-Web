import "server-only";

/**
 * Service-role Supabase client. SERVER ONLY.
 *
 * The `server-only` import above makes the build fail if this module is ever
 * pulled into a Client Component bundle.
 *
 * This client uses the service-role key and therefore BYPASSES Row Level
 * Security. Every admin read/write (dashboard, draws, winners, CSV export) and
 * every public aggregate query (results page winners list, live entry count)
 * goes through here — inside API routes / server components only, never exposed
 * to the browser.
 */
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";
import { serverEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

let cached: ReturnType<typeof createClient<Database>> | null = null;

export function createAdminClient() {
  // Reuse one instance per server runtime — the Supabase JS client is a
  // PostgREST wrapper over pooled HTTP, so this is safe under serverless
  // concurrency (and we never open a raw `pg` connection).
  if (cached) return cached;
  cached = createClient<Database>(
    publicEnv.supabaseUrl,
    serverEnv.supabaseServiceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
  return cached;
}
