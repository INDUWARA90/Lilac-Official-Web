-- ============================================================================
-- Lilac — paid event e-tickets (manual bank transfer). Apply after 0001–0007.
-- Safe to re-run.
--
--   ticket_settings   singleton: price, capacity, sales toggle, bank details
--   ticket_purchases  one row per purchase (a buyer may request several seats)
--   tickets           one row per issued seat; `token` goes in the QR code
--   create_ticket_purchase()  capacity-safe insert (serialises on the settings row)
--
-- All tables are service-role only. The public purchase form reaches the DB
-- through create_ticket_purchase() (SECURITY DEFINER) via the API route.
-- ============================================================================

create table if not exists public.ticket_settings (
  id                  text primary key default 'default' check (id = 'default'),
  price_lkr           integer not null default 500 check (price_lkr >= 0),
  capacity            integer not null default 100 check (capacity >= 0),
  sales_open          boolean not null default true,
  bank_name           text not null default '',
  bank_account_name   text not null default '',
  bank_account_number text not null default '',
  bank_branch         text not null default '',
  bank_instructions   text not null default '',
  updated_at          timestamptz not null default now(),
  updated_by          text
);
insert into public.ticket_settings (id) values ('default') on conflict (id) do nothing;

create table if not exists public.ticket_purchases (
  id           uuid primary key default gen_random_uuid(),
  reference    text not null unique,
  name         text not null,
  email        text not null,
  phone        text not null,
  quantity     integer not null check (quantity between 1 and 10),
  amount_lkr   integer not null,
  slip_path    text not null,
  status       text not null default 'pending_review'
                 check (status in ('pending_review', 'approved', 'rejected', 'cancelled')),
  review_note  text,
  reviewed_by  text,
  reviewed_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists ticket_purchases_status_idx    on public.ticket_purchases (status);
create index if not exists ticket_purchases_created_at_idx on public.ticket_purchases (created_at desc);
-- One live purchase per person; a rejected/cancelled one doesn't block a retry.
create unique index if not exists ticket_purchases_email_live_idx
  on public.ticket_purchases (lower(email)) where status in ('pending_review', 'approved');
create unique index if not exists ticket_purchases_phone_live_idx
  on public.ticket_purchases (phone) where status in ('pending_review', 'approved');

create table if not exists public.tickets (
  id            uuid primary key default gen_random_uuid(),
  purchase_id   uuid not null references public.ticket_purchases (id) on delete cascade,
  token         text not null unique,
  seat_label    text not null,
  holder_name   text not null,
  checked_in_at timestamptz,
  checked_in_by text,
  created_at    timestamptz not null default now()
);
create index if not exists tickets_purchase_id_idx on public.tickets (purchase_id);

create or replace function public.create_ticket_purchase(
  p_name text, p_email text, p_phone text, p_quantity integer,
  p_slip_path text, p_reference text
) returns table (purchase_id uuid, purchase_reference text)
language plpgsql
security definer
set search_path = public
as $$
declare
  s       public.ticket_settings%rowtype;
  v_taken integer;
  v_id    uuid;
begin
  select * into s from public.ticket_settings where id = 'default' for update;
  if not found then raise exception 'NO_SETTINGS'; end if;
  if not s.sales_open then raise exception 'SALES_CLOSED'; end if;
  if p_quantity < 1 or p_quantity > 10 then raise exception 'BAD_QUANTITY'; end if;

  select coalesce(sum(quantity), 0) into v_taken
  from public.ticket_purchases
  where status in ('pending_review', 'approved');

  if v_taken + p_quantity > s.capacity then raise exception 'SOLD_OUT'; end if;

  insert into public.ticket_purchases
    (reference, name, email, phone, quantity, amount_lkr, slip_path)
  values
    (p_reference, p_name, lower(p_email), p_phone, p_quantity, p_quantity * s.price_lkr, p_slip_path)
  returning id into v_id;

  return query select v_id, p_reference;
end $$;

alter table public.ticket_settings  enable row level security;
alter table public.ticket_purchases enable row level security;
alter table public.tickets          enable row level security;

revoke all on function public.create_ticket_purchase(text, text, text, integer, text, text) from public;
grant execute on function public.create_ticket_purchase(text, text, text, integer, text, text)
  to anon, authenticated, service_role;
