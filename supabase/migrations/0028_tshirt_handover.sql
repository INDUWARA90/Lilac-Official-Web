-- Physical T-shirt collection state. Existing rows receive the default false
-- value, so every order begins as "Not given" until staff record a handover.
alter table public.tshirt_orders
  add column if not exists handed_over boolean not null default false,
  add column if not exists handed_over_at timestamptz,
  add column if not exists handed_over_by text;

create index if not exists tshirt_orders_handed_over_idx
  on public.tshirt_orders (handed_over)
  where handed_over = false;
