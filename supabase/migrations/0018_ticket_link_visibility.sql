-- Allow the full admin to hide public links to ticket purchases and status
-- without closing ticket sales or affecting existing ticket URLs.

alter table public.ticket_settings
  add column if not exists ticket_links_visible boolean not null default true;
