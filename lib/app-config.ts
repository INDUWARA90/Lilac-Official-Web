import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Single-row `app_config` — app-wide flags read/written server-side.
 */

export async function getDrawUnlocked(): Promise<boolean> {
  const { data } = await createAdminClient()
    .from("app_config")
    .select("draw_unlocked")
    .eq("id", "default")
    .maybeSingle();
  return data?.draw_unlocked ?? false;
}

export async function setDrawUnlocked(unlocked: boolean, by: string): Promise<boolean> {
  const { error } = await createAdminClient()
    .from("app_config")
    .update({ draw_unlocked: unlocked, updated_at: new Date().toISOString(), updated_by: by })
    .eq("id", "default");
  return !error;
}
