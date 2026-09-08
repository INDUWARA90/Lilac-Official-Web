/**
 * Hand-written database types mirroring supabase/migrations/0001_init.sql.
 *
 * Later this can be replaced by the generated file:
 *   npx supabase gen types typescript --project-id <ref> > lib/supabase/types.ts
 * For now a hand-written shape keeps the app fully typed without the CLI.
 */

export type EmailStatus = "pending" | "sent" | "failed";

export interface EntryRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  age_range: string | null;
  gender: string | null;
  occupation: string | null;
  district: string | null;
  consent_at: string;
  ad_watched_at: string | null;
  verified: boolean;
  verified_at: string | null;
  verification_token: string;
  verification_sent_at: string | null;
  ticket_code: string;
  created_at: string;
}

/** Columns the anon client is allowed to provide on INSERT. Everything else is
 *  set by the `trg_set_entry_defaults` trigger. */
export interface EntryInsert {
  name: string;
  email: string;
  phone: string;
  address: string;
  age_range?: string | null;
  gender?: string | null;
  occupation?: string | null;
  district?: string | null;
  consent_at: string;
  ad_watched_at?: string | null;
}

export interface DrawRow {
  id: string;
  admin_id: string | null;
  winner_count: number;
  drawn_at: string;
}

export interface WinnerRow {
  id: string;
  entry_id: string;
  draw_id: string;
  email_status: EmailStatus;
  email_sent_at: string | null;
  created_at: string;
}

export interface AuditLogRow {
  id: string;
  admin_id: string | null;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      entries: { Row: EntryRow; Insert: EntryInsert; Update: Partial<EntryRow> };
      draws: {
        Row: DrawRow;
        Insert: Omit<DrawRow, "id" | "drawn_at"> & Partial<Pick<DrawRow, "id" | "drawn_at">>;
        Update: Partial<DrawRow>;
      };
      winners: {
        Row: WinnerRow;
        Insert: Omit<WinnerRow, "id" | "created_at"> &
          Partial<Pick<WinnerRow, "id" | "created_at" | "email_status" | "email_sent_at">>;
        Update: Partial<WinnerRow>;
      };
      audit_log: {
        Row: AuditLogRow;
        Insert: Omit<AuditLogRow, "id" | "created_at"> &
          Partial<Pick<AuditLogRow, "id" | "created_at" | "details">>;
        Update: Partial<AuditLogRow>;
      };
    };
  };
}
