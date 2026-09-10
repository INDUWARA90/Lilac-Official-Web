-- ============================================================================
-- Lilac — drop the email-verification step and the public ticket code.
-- Apply after 0001–0003 (SQL Editor → paste → Run). Idempotent.
--
-- After this: an entry counts as soon as it's submitted (the API flips
-- `verified` to true straight away), and there is no per-entry ticket code.
-- ============================================================================

-- 1. Trigger no longer generates a ticket code; it just marks the row verified.
create or replace function public.set_entry_defaults()
returns trigger
language plpgsql
as $$
begin
  new.verified    := true;
  new.verified_at := now();
  new.created_at  := now();
  return new;
end $$;

-- 2. Drop the ticket-code column, its index and generator function.
drop index if exists public.entries_ticket_code_key;
alter table public.entries drop column if exists ticket_code;
drop function if exists public.generate_ticket_code();

-- 3. Drop the now-unused verification-token columns and index.
drop index if exists public.entries_verification_token_idx;
alter table public.entries drop column if exists verification_token;
alter table public.entries drop column if exists verification_sent_at;
