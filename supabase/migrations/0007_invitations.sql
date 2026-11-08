-- Stage 7: sending invitations.
-- A per-event guest list (invitees) that staff import, and a log of every
-- invitation sent by email, SMS or WhatsApp (manual wa.me click).
-- Invitees still register themselves through the public page; "registered"
-- is derived by matching phone or email against inv_registrations.

create type public.inv_channel as enum ('email', 'sms', 'whatsapp');

create table public.inv_invitees (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.inv_events(id) on delete cascade,
  full_name   text not null check (char_length(full_name) between 1 and 120),
  phone       text check (phone is null or phone ~ '^\+[1-9][0-9]{6,14}$'),  -- E.164
  email       text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (phone is not null or email is not null)
);

create index inv_invitees_event_idx on public.inv_invitees (event_id, created_at);
create unique index inv_invitees_event_phone_uq on public.inv_invitees (event_id, phone) where phone is not null;
create unique index inv_invitees_event_email_uq on public.inv_invitees (event_id, lower(email)) where email is not null;

create trigger inv_invitees_set_updated_at
  before update on public.inv_invitees
  for each row execute function public.inv_set_updated_at();

create table public.inv_invitation_log (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references public.inv_events(id) on delete cascade,
  invitee_id   uuid references public.inv_invitees(id) on delete set null,
  channel      public.inv_channel not null,
  to_address   text not null,
  status       public.inv_email_status not null,
  error        text,
  provider_id  text,
  sent_by      uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index inv_invitation_log_event_idx on public.inv_invitation_log (event_id, created_at desc);
create index inv_invitation_log_invitee_idx on public.inv_invitation_log (invitee_id, created_at desc);

-- Free text the business writes once per event, used for SMS / WhatsApp and
-- as the opening paragraph of the invitation email.
alter table public.inv_events
  add column invitation_message text check (invitation_message is null or char_length(invitation_message) <= 1000);

alter table public.inv_invitees enable row level security;
alter table public.inv_invitation_log enable row level security;

create policy "inv staff full access to invitees"
  on public.inv_invitees for all
  to authenticated
  using (public.inv_is_staff()) with check (public.inv_is_staff());

create policy "inv staff read invitation log"
  on public.inv_invitation_log for select
  to authenticated
  using (public.inv_is_staff());

create policy "inv staff insert invitation log"
  on public.inv_invitation_log for insert
  to authenticated
  with check (public.inv_is_staff());
