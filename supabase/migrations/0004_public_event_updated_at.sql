-- Expose updated_at so share-image URLs can be versioned per edit.
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
    'updated_at', e.updated_at,
    'confirmed_guests', coalesce((
      select sum(r.guest_count) from public.inv_registrations r
      where r.event_id = e.id and r.status = 'confirmed'
    ), 0)
  )
  from public.inv_events e
  where e.slug = p_slug and e.is_active;
$$;
