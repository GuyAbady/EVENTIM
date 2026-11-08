-- Log of every email the system sends, for the admin UI and for debugging.
create type public.inv_email_kind as enum ('reminder', 'manual', 'test');
create type public.inv_email_status as enum ('sent', 'failed');

create table public.inv_email_log (
  id               uuid primary key default gen_random_uuid(),
  event_id         uuid references public.inv_events(id) on delete cascade,
  registration_id  uuid references public.inv_registrations(id) on delete set null,
  kind             public.inv_email_kind not null,
  to_email         text not null,
  subject          text not null,
  status           public.inv_email_status not null,
  error            text,
  sent_by          uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now()
);

create index inv_email_log_event_idx on public.inv_email_log (event_id, created_at desc);

alter table public.inv_email_log enable row level security;

create policy "inv staff read email log"
  on public.inv_email_log for select
  to authenticated
  using (public.inv_is_staff());

-- Inserts happen on the server (service role or staff session).
create policy "inv staff insert email log"
  on public.inv_email_log for insert
  to authenticated
  with check (public.inv_is_staff());
