alter table public.tshirt_settings
  add column if not exists tshirt_link_visible boolean not null default true;
