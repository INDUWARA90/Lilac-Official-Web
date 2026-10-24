-- A fresh T-shirt order round. This creates a separate table and does not
-- copy, update, tag, or otherwise alter any existing public.tshirt_orders row.
create table if not exists public.tshirt_new_orders (
  like public.tshirt_orders including all
);

alter table public.tshirt_new_orders enable row level security;

-- The new round uses the existing price and public-sales settings, but inserts
-- only into tshirt_new_orders.
create or replace function public.create_new_tshirt_order(
  p_name text,
  p_registration_number text,
  p_faculty text,
  p_email text,
  p_phone text,
  p_order_items jsonb,
  p_paid_amount_lkr integer,
  p_receipt_path text,
  p_reference text
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  s public.tshirt_settings%rowtype;
  v_id uuid;
  v_quantity integer;
  v_total_lkr integer;
begin
  select * into s from public.tshirt_settings where id = 'default' for update;
  if not found then raise exception 'NO_SETTINGS'; end if;
  if not s.sales_open then raise exception 'SALES_CLOSED'; end if;
  if jsonb_typeof(p_order_items) is distinct from 'array' then raise exception 'BAD_ITEMS'; end if;

  v_quantity := jsonb_array_length(p_order_items);
  if v_quantity < 1 or v_quantity > 3 then raise exception 'BAD_QUANTITY'; end if;
  if exists (
    select 1 from jsonb_array_elements(p_order_items) as item
    where coalesce(item ->> 'size', '') not in ('M', 'L', 'XL', 'XXL')
       or coalesce(item ->> 'color', '') not in ('White', 'Black')
  ) then raise exception 'BAD_ITEMS'; end if;

  v_total_lkr := v_quantity * s.price_lkr;
  if p_paid_amount_lkr < v_quantity * 1000 or p_paid_amount_lkr > v_total_lkr then
    raise exception 'BAD_PAYMENT_AMOUNT';
  end if;

  insert into public.tshirt_new_orders
    (reference, name, registration_number, faculty, email, phone, tshirt_size,
     quantity, order_items, amount_lkr, paid_amount_lkr, receipt_path)
  values
    (p_reference, p_name, p_registration_number, p_faculty, lower(p_email), p_phone,
     p_order_items -> 0 ->> 'size', v_quantity, p_order_items,
     v_total_lkr, p_paid_amount_lkr, p_receipt_path)
  returning id into v_id;
  return v_id;
end $$;

revoke all on function public.create_new_tshirt_order(text, text, text, text, text, jsonb, integer, text, text) from public;
grant execute on function public.create_new_tshirt_order(text, text, text, text, text, jsonb, integer, text, text)
  to anon, authenticated, service_role;
