-- ============================================================================
-- DESTRUCTIVE Lilac application database reset.
--
-- This removes the app's public tables and app RPC functions. It does NOT
-- touch Supabase-managed auth/storage schemas, storage buckets/files, users,
-- project settings, or unrelated public tables.
--
-- After running this file, apply supabase/migrations/0001_init.sql through
-- 0017_remove_audit_log.sql in numeric order, one migration at a time.
-- The migrations recreate the schema expected by the current application and
-- seed default app, ticket, and T-shirt settings. Re-add sponsor ads and
-- configure payment details after rebuilding.
--
-- Back up the project first. Do not run this against production unless you
-- intend to permanently delete all Lilac application data.
-- ============================================================================

begin;

drop table if exists
  public.winners,
  public.tickets,
  public.ticket_purchases,
  public.tshirt_orders,
  public.entries,
  public.draws,
  public.events,
  public.contact_messages,
  public.rate_limits,
  public.ticket_settings,
  public.tshirt_settings,
  public.app_config,
  public.ads,
  public.video_config,
  public.audit_log;

drop function if exists public.set_entry_defaults() cascade;
drop function if exists public.generate_ticket_code() cascade;
drop function if exists public.create_ticket_purchase(text, text, text, integer, text, text) cascade;
drop function if exists public.create_ticket_purchase(text, text, text, text, integer, text, text) cascade;
drop function if exists public.create_tshirt_order(text, text, text, text, text, text, integer, text, text) cascade;
drop function if exists public.create_entry(text, text, text, text, text, text, text, text, timestamptz) cascade;
drop function if exists public.create_event(text) cascade;
drop function if exists public.create_event(text, uuid) cascade;
drop function if exists public.rl_hit(text, integer, bigint) cascade;

drop type if exists public.email_status cascade;

commit;
