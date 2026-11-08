-- Invitation system: initial schema
--
-- This database is shared with another application, so everything here is
-- prefixed with `inv_` and uses its own helper function. Staff access is
-- limited to users listed in `inv_staff`, not every authenticated user.
--
-- Guests register through a public link; the server inserts registrations
-- with the service role (bypasses RLS). Staff read and manage through RLS.

create extension if not exists "pgcrypto";

-- ---------- helpers ----------
create or replace function public.inv_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- staff allowlist ----------
create table public.inv_staff (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  display_name text,
  created_at  timestamptz not null default now()
);

create or replace function public.inv_is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.inv_staff where user_id = auth.uid()
  );
$$;

-- ---------- events ----------
create type public.inv_event_type as enum ('private', 'business');

create table public.inv_events (
  id                     uuid primary key default gen_random_uuid(),
  slug                   text not null unique,
  title                  text not null,
  event_type             public.inv_event_type not null default 'private',
  description            text,
  date_time              timestamptz not null,
  venue_name             text,
  address                text,
  lat                    double precision,
  lng                    double precision,
  template_id            text not null default 'classic',
  media_url              text,
  primary_color          text,
  gift_link_url          text,
  reminder_offset_hours  integer not null default 24 check (reminder_offset_hours >= 0),
  reminder_sent_at       timestamptz,
  rsvp_deadline          timestamptz,
  max_guests             integer check (max_guests is null or max_guests > 0),
  is_active              boolean not null default true,
  created_by             uuid references auth.users(id) on delete set null,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index inv_events_date_time_idx on public.inv_events (date_time);
create index inv_events_reminder_due_idx on public.inv_events (date_time)
  where reminder_sent_at is null and is_active;

create trigger inv_events_set_updated_at
  before update on public.inv_events
  for each row execute function public.inv_set_updated_at();

-- ---------- registrations ----------
create type public.inv_registration_status as enum ('confirmed', 'cancelled');
create type public.inv_registration_source as enum ('self', 'manual');

create table public.inv_registrations (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references public.inv_events(id) on delete cascade,
  full_name    text not null check (char_length(full_name) between 1 and 120),
  phone        text not null check (phone ~ '^\+[1-9][0-9]{6,14}$'),  -- E.164
  email        text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  guest_count  integer not null default 1 check (guest_count between 1 and 50),
  guest_names  jsonb not null default '[]'::jsonb,
  notes        text check (notes is null or char_length(notes) <= 1000),
  status       public.inv_registration_status not null default 'confirmed',
  source       public.inv_registration_source not null default 'self',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (event_id, phone)
);

create index inv_registrations_event_idx on public.inv_registrations (event_id);

create trigger inv_registrations_set_updated_at
  before update on public.inv_registrations
  for each row execute function public.inv_set_updated_at();

-- ---------- row level security ----------
alter table public.inv_staff enable row level security;
alter table public.inv_events enable row level security;
alter table public.inv_registrations enable row level security;

-- Staff can see who else is staff. Adding staff is done with the service role.
create policy "inv staff read staff"
  on public.inv_staff for select
  to authenticated
  using (public.inv_is_staff());

create policy "inv staff full access to events"
  on public.inv_events for all
  to authenticated
  using (public.inv_is_staff()) with check (public.inv_is_staff());

create policy "inv staff full access to registrations"
  on public.inv_registrations for all
  to authenticated
  using (public.inv_is_staff()) with check (public.inv_is_staff());

-- No policies for `anon` on purpose: the public event page and the
-- registration endpoint run on the server with the service role.

-- ---------- storage ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'inv-event-media',
  'inv-event-media',
  true,
  10485760, -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

create policy "inv-event-media: public read"
  on storage.objects for select
  to public
  using (bucket_id = 'inv-event-media');

create policy "inv-event-media: staff insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'inv-event-media' and public.inv_is_staff());

create policy "inv-event-media: staff update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'inv-event-media' and public.inv_is_staff());

create policy "inv-event-media: staff delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'inv-event-media' and public.inv_is_staff());
