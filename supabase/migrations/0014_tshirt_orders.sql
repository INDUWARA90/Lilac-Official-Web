-- Lilac T-shirt orders. Receipts are kept in the private `tshirt-receipts`
-- Storage bucket; only the server/service role can create signed links.

create table if not exists public.tshirt_settings (
  id          text primary key default 'default' check (id = 'default'),
  price_lkr   integer not null default 2500 check (price_lkr >= 0),
  sales_open  boolean not null default true,
  updated_at  timestamptz not null default now(),
  updated_by  text
);
insert into public.tshirt_settings (id) values ('default') on conflict (id) do nothing;

create table if not exists public.tshirt_orders (
  id                  uuid primary key default gen_random_uuid(),
  reference           text not null unique,
  name                text not null,
  registration_number text not null,
  faculty             text not null,
  email               text not null,
  phone               text not null,
  tshirt_size         text not null check (tshirt_size in ('XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL')),
  quantity            integer not null check (quantity between 1 and 10),
  amount_lkr          integer not null check (amount_lkr >= 0),
  receipt_path        text not null,
  status              text not null default 'pending_review'
                        check (status in ('pending_review', 'payment_collected', 'rejected', 'cancelled')),
  review_note         text,
  collected_by        text,
  collected_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists tshirt_orders_status_idx on public.tshirt_orders (status);
create index if not exists tshirt_orders_created_at_idx on public.tshirt_orders (created_at desc);
create index if not exists tshirt_orders_registration_number_idx on public.tshirt_orders (registration_number);

alter table public.tshirt_settings enable row level security;
alter table public.tshirt_orders enable row level security;

create or replace function public.create_tshirt_order(
  p_name text, p_registration_number text, p_faculty text, p_email text,
  p_phone text, p_tshirt_size text, p_quantity integer, p_receipt_path text,
  p_reference text
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  s public.tshirt_settings%rowtype;
  v_id uuid;
begin
  select * into s from public.tshirt_settings where id = 'default' for update;
  if not found then raise exception 'NO_SETTINGS'; end if;
  if not s.sales_open then raise exception 'SALES_CLOSED'; end if;
  if p_quantity < 1 or p_quantity > 10 then raise exception 'BAD_QUANTITY'; end if;

  insert into public.tshirt_orders
    (reference, name, registration_number, faculty, email, phone, tshirt_size, quantity, amount_lkr, receipt_path)
  values
    (p_reference, p_name, p_registration_number, p_faculty, lower(p_email), p_phone,
     p_tshirt_size, p_quantity, p_quantity * s.price_lkr, p_receipt_path)
  returning id into v_id;
  return v_id;
end $$;

revoke all on function public.create_tshirt_order(text, text, text, text, text, text, integer, text, text) from public;
grant execute on function public.create_tshirt_order(text, text, text, text, text, text, integer, text, text)
  to anon, authenticated, service_role;
