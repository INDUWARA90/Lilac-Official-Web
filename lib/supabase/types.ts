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

export type EmailStatus = "pending" | "sending" | "sent" | "failed";
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

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

export type ContactMessageRow = {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
};

export type EventType = "ad_view" | "ad_complete" | "ad_shown" | "ad_watched";

export type EventRow = {
  id: string;
  type: EventType;
  /** Set for 'ad_shown'/'ad_watched' — which ad the event was about. */
  ad_id: string | null;
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
  seating_price_lkr: number;
  standing_price_lkr: number;
  seating_capacity: number;
  standing_capacity: number;
  sales_open: boolean;
  ticket_links_visible: boolean;
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
  ticket_type: "seating" | "standing";
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

export type TshirtSettingsRow = {
  id: string;
  price_lkr: number;
  sales_open: boolean;
  tshirt_link_visible: boolean;
  updated_at: string;
  updated_by: string | null;
};

export type TshirtOrderStatusDb = "pending_review" | "payment_collected" | "rejected" | "cancelled";
export type TshirtOrderRow = {
  id: string; reference: string; name: string; registration_number: string; faculty: string;
  email: string; phone: string; tshirt_size: string; quantity: number; amount_lkr: number;
  order_items: { size: string; color: string }[] | null;
  receipt_path: string; status: TshirtOrderStatusDb; review_note: string | null;
  collected_by: string | null; collected_at: string | null; created_at: string; updated_at: string;
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
      events: TableShape<
        EventRow,
        Pick<EventRow, "type"> & Partial<Omit<EventRow, "type">>,
        Partial<EventRow>
      >;
      contact_messages: TableShape<
        ContactMessageRow,
        Omit<ContactMessageRow, "id" | "created_at"> &
          Partial<Pick<ContactMessageRow, "id" | "created_at">>,
        Partial<ContactMessageRow>
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
      tshirt_settings: TableShape<TshirtSettingsRow, Partial<TshirtSettingsRow>, Partial<TshirtSettingsRow>>;
      tshirt_orders: TableShape<
        TshirtOrderRow,
        Omit<TshirtOrderRow, "id" | "created_at" | "updated_at" | "status"> & Partial<Pick<TshirtOrderRow, "id" | "created_at" | "updated_at" | "status">>,
        Partial<TshirtOrderRow>
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
          p_ticket_type: "seating" | "standing";
          p_quantity: number;
          p_slip_path: string;
          p_reference: string;
        };
        Returns: { purchase_id: string; purchase_reference: string }[];
      };
      create_tshirt_order: {
        Args: { p_name: string; p_registration_number: string; p_faculty: string; p_email: string; p_phone: string; p_order_items: Json; p_receipt_path: string; p_reference: string };
        Returns: string;
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
        Args: { p_type: string; p_ad_id?: string | null };
        Returns: undefined;
      };
    };
    Enums: {
      email_status: EmailStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
