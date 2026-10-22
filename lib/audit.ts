import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Append a row to `audit_log`. Best-effort: a logging failure must never break
 * the action being logged.
 */
export async function logAudit(
  action: string,
  details: Record<string, unknown>,
  adminId?: string | null,
): Promise<void> {
  try {
    await createAdminClient().from("audit_log").insert({
      admin_id: adminId ?? null,
      action,
      details,
    });
  } catch (err) {
    console.error(`audit_log write failed for action "${action}"`, err);
  }
}
