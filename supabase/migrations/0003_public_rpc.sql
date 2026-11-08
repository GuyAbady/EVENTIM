-- Public access goes through two SECURITY DEFINER functions instead of table
-- policies. The anon key can only read an active event's public fields and
-- register a guest with validated input. Everything else stays staff-only.

-- ---------- public event ----------
create or replace function public.inv_public_event(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', e.id,
    'slug', e.slug,
    'title', e.title,
    'event_type', e.event_type,
    'description', e.description,
    'date_time', e.date_time,
    'venue_name', e.venue_name,
    'address', e.address,
    'lat', e.lat,
    'lng', e.lng,
    'template_id', e.template_id,
    'media_url', e.media_url,
    'primary_color', e.primary_color,
    'gift_link_url', e.gift_link_url,
    'rsvp_deadline', e.rsvp_deadline,
    'max_guests', e.max_guests,
    'confirmed_guests', coalesce((
      select sum(r.guest_count) from public.inv_registrations r
      where r.event_id = e.id and r.status = 'confirmed'
    ), 0)
  )
  from public.inv_events e
  where e.slug = p_slug and e.is_active;
$$;

-- ---------- register ----------
create or replace function public.inv_register(
  p_slug text,
  p_full_name text,
  p_phone text,
  p_email text,
  p_guest_count integer,
  p_guest_names jsonb,
  p_notes text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.inv_events%rowtype;
  v_existing public.inv_registrations%rowtype;
  v_confirmed integer;
  v_id uuid;
  v_created boolean;
begin
  select * into v_event from public.inv_events where slug = p_slug and is_active;
  if not found then
    raise exception 'not_found' using errcode = 'P0001';
  end if;

  if v_event.rsvp_deadline is not null and now() > v_event.rsvp_deadline then
    raise exception 'closed' using errcode = 'P0001';
  end if;
  if now() > v_event.date_time then
    raise exception 'closed' using errcode = 'P0001';
  end if;

  if p_guest_count < 1 or p_guest_count > 50 then
    raise exception 'invalid' using errcode = 'P0001';
  end if;
  if jsonb_typeof(p_guest_names) <> 'array' or jsonb_array_length(p_guest_names) <> p_guest_count then
    raise exception 'invalid' using errcode = 'P0001';
  end if;

  select * into v_existing
  from public.inv_registrations
  where event_id = v_event.id and phone = p_phone;

  if v_event.max_guests is not null then
    select coalesce(sum(guest_count), 0) into v_confirmed
    from public.inv_registrations
    where event_id = v_event.id and status = 'confirmed'
      and (v_existing.id is null or id <> v_existing.id);
    if v_confirmed + p_guest_count > v_event.max_guests then
      raise exception 'full' using errcode = 'P0001';
    end if;
  end if;

  if v_existing.id is null then
    insert into public.inv_registrations
      (event_id, full_name, phone, email, guest_count, guest_names, notes, status, source)
    values
      (v_event.id, p_full_name, p_phone, p_email, p_guest_count, p_guest_names, p_notes, 'confirmed', 'self')
    returning id into v_id;
    v_created := true;
  else
    update public.inv_registrations
      set full_name = p_full_name,
          email = p_email,
          guest_count = p_guest_count,
          guest_names = p_guest_names,
          notes = p_notes,
          status = 'confirmed'
    where id = v_existing.id
    returning id into v_id;
    v_created := false;
  end if;

  return jsonb_build_object('id', v_id, 'created', v_created);
end;
$$;

revoke all on function public.inv_public_event(text) from public;
grant execute on function public.inv_public_event(text) to anon, authenticated;

revoke all on function public.inv_register(text, text, text, text, integer, jsonb, text) from public;
grant execute on function public.inv_register(text, text, text, text, integer, jsonb, text) to anon, authenticated;
