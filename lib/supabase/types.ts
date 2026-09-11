/**
 * Hand-written database types mirroring supabase/migrations/0001_init.sql.
 *
 * These are declared as `type` (not `interface`) on purpose: the Supabase client
 * generics require each Row/Insert/Update to be assignable to
 * `Record<string, unknown>`, and TypeScript only allows that for type aliases,
 * not interfaces (interfaces can be augmented, so they lack an implicit index
 * signature).
 *
 * Can later be replaced by the generated file:
 *   npx supabase gen types typescript --project-id <ref> > lib/supabase/types.ts
 */

export type EmailStatus = "pending" | "sent" | "failed";

export type EntryRow = {
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
  // `verified` is flipped to true by the entry API route right after insert (a
  // BEFORE INSERT trigger forces it false). It stays as an "insert completed"
  // marker; the draw only considers verified entries.
  verified: boolean;
  verified_at: string | null;
  created_at: string;
};

/** Columns the anon client may provide on INSERT. Everything else is set by the
 *  `trg_set_entry_defaults` trigger. */
export type EntryInsert = {
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
};

export type DrawRow = {
  id: string;
  admin_id: string | null;
  winner_count: number;
  drawn_at: string;
};

export type WinnerRow = {
  id: string;
  entry_id: string;
  draw_id: string;
  email_status: EmailStatus;
  email_sent_at: string | null;
  created_at: string;
};

export type AuditLogRow = {
  id: string;
  admin_id: string | null;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
};

export type EventType = "ad_view" | "ad_complete";

export type EventRow = {
  id: string;
  type: EventType;
  created_at: string;
};

export type AdKind = "youtube" | "video_file" | "image";

export type AdRow = {
  id: string;
  kind: AdKind;
  youtube_id: string | null;
  storage_path: string | null;
  title: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
};

export type AppConfigRow = {
  id: string;
  draw_unlocked: boolean;
  updated_at: string;
  updated_by: string | null;
};

export type TicketSettingsRow = {
  id: string;
  price_lkr: number;
  capacity: number;
  sales_open: boolean;
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  bank_branch: string;
  bank_instructions: string;
  updated_at: string;
  updated_by: string | null;
};

export type TicketPurchaseStatusDb =
  | "pending_review"
  | "approved"
  | "rejected"
  | "cancelled";

export type TicketPurchaseRow = {
  id: string;
  reference: string;
  name: string;
  email: string;
  phone: string;
  quantity: number;
  amount_lkr: number;
  slip_path: string;
  status: TicketPurchaseStatusDb;
  review_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TicketRow = {
  id: string;
  purchase_id: string;
  token: string;
  seat_label: string;
  holder_name: string;
  checked_in_at: string | null;
  checked_in_by: string | null;
  created_at: string;
};

type TableShape<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      entries: TableShape<EntryRow, EntryInsert, Partial<EntryRow>>;
      draws: TableShape<
        DrawRow,
        Omit<DrawRow, "id" | "drawn_at"> & Partial<Pick<DrawRow, "id" | "drawn_at">>,
        Partial<DrawRow>
      >;
      winners: TableShape<
        WinnerRow,
        Pick<WinnerRow, "entry_id" | "draw_id"> &
          Partial<Omit<WinnerRow, "entry_id" | "draw_id">>,
        Partial<WinnerRow>
      >;
      audit_log: TableShape<
        AuditLogRow,
        Omit<AuditLogRow, "id" | "created_at"> &
          Partial<Pick<AuditLogRow, "id" | "created_at" | "details">>,
        Partial<AuditLogRow>
      >;
      events: TableShape<
        EventRow,
        Pick<EventRow, "type"> & Partial<Omit<EventRow, "type">>,
        Partial<EventRow>
      >;
      ads: TableShape<
        AdRow,
        Omit<AdRow, "id" | "created_at" | "updated_at"> &
          Partial<Pick<AdRow, "id" | "created_at" | "updated_at">>,
        Partial<AdRow>
      >;
      app_config: TableShape<AppConfigRow, Partial<AppConfigRow>, Partial<AppConfigRow>>;
      ticket_settings: TableShape<
        TicketSettingsRow,
        Partial<TicketSettingsRow>,
        Partial<TicketSettingsRow>
      >;
      ticket_purchases: TableShape<
        TicketPurchaseRow,
        Omit<TicketPurchaseRow, "id" | "created_at" | "updated_at" | "status"> &
          Partial<Pick<TicketPurchaseRow, "id" | "created_at" | "updated_at" | "status">>,
        Partial<TicketPurchaseRow>
      >;
      tickets: TableShape<
        TicketRow,
        Omit<TicketRow, "id" | "created_at" | "checked_in_at" | "checked_in_by"> &
          Partial<
            Pick<TicketRow, "id" | "created_at" | "checked_in_at" | "checked_in_by">
          >,
        Partial<TicketRow>
      >;
    };
    Views: { [_ in never]: never };
    Functions: {
      rl_hit: {
        Args: { p_key: string; p_limit: number; p_window_ms: number };
        Returns: boolean;
      };
      create_ticket_purchase: {
        Args: {
          p_name: string;
          p_email: string;
          p_phone: string;
          p_quantity: number;
          p_slip_path: string;
          p_reference: string;
        };
        Returns: { purchase_id: string; purchase_reference: string }[];
      };
      create_entry: {
        Args: {
          p_name: string;
          p_email: string;
          p_phone: string;
          p_address: string;
          p_age_range: string | null;
          p_gender: string | null;
          p_occupation: string | null;
          p_district: string | null;
          p_ad_watched_at: string | null;
        };
        Returns: string;
      };
      create_event: {
        Args: { p_type: string };
        Returns: undefined;
      };
    };
    Enums: {
      email_status: EmailStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
