-- Transactional ticket-email outbox. One ticket purchase can have only one
-- successful email record, regardless of restarts or repeated approval clicks.
create table if not exists public.ticket_email_deliveries (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null unique references public.ticket_purchases(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending', 'sending', 'sent', 'failed')),
  attempts integer not null default 0,
  locked_at timestamptz,
  sent_at timestamptz,
  provider_message_id text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ticket_email_deliveries_status_idx on public.ticket_email_deliveries (status, created_at);
alter table public.ticket_email_deliveries enable row level security;
