-- Allow admins to reveal or hide the artist lineup on public pages.
alter table public.app_config
  add column if not exists artist_reveal_visible boolean not null default false;
