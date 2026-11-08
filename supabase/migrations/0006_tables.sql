-- Seating: tables per event, each registration (party) sits at one table.
create table public.inv_tables (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.inv_events(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 60),
  capacity    integer not null default 10 check (capacity between 1 and 500),
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create index inv_tables_event_idx on public.inv_tables (event_id, sort_order);

alter table public.inv_registrations
  add column table_id uuid references public.inv_tables(id) on delete set null;

create index inv_registrations_table_idx on public.inv_registrations (table_id);

alter table public.inv_tables enable row level security;

create policy "inv staff full access to tables"
  on public.inv_tables for all
  to authenticated
  using (public.inv_is_staff()) with check (public.inv_is_staff());
