-- ============================================================================
-- Lilac — sponsor ads become an ordered list (was: a single `video_config` row).
-- Apply after 0001–0004 (SQL Editor → paste → Run). Safe to re-run.
--
-- Each ad is a YouTube video, an uploaded video file, or an uploaded image
-- ("post"). The public flow shows them in `sort_order` and gates progress:
-- videos require 5s of actual playback, images auto-advance after a 5s delay.
-- Only once every ad in the list has been shown does the visitor reach the
-- entry form.
-- ============================================================================

create table if not exists public.ads (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null check (kind in ('youtube', 'video_file', 'image')),
  youtube_id   text,
  storage_path text,
  title        text not null default 'Sponsor message',
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  updated_by   uuid references auth.users (id)
);

create index if not exists ads_sort_order_idx on public.ads (sort_order);

-- Carry the old single video over as the first ad (only if the old table is
-- still around and this hasn't already run), then drop it.
do $$
begin
  if to_regclass('public.video_config') is not null then
    insert into public.ads (kind, youtube_id, storage_path, title, sort_order)
    select
      case when kind = 'file' then 'video_file' else 'youtube' end,
      youtube_id,
      storage_path,
      title,
      0
    from public.video_config
    where id = 'default'
      and (youtube_id is not null or storage_path is not null)
      and not exists (select 1 from public.ads);

    drop table public.video_config;
  end if;
end $$;

-- Service-role only: RLS on, no policies. The public flow reads this through a
-- server component using the service-role key.
alter table public.ads enable row level security;
