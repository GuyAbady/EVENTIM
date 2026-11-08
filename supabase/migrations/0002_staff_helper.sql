-- Helper for onboarding staff: run from the SQL editor or with the service role.
--   select public.inv_add_staff('person@example.com', 'Display Name');
-- The user must already exist in Authentication > Users.

create or replace function public.inv_add_staff(p_email text, p_display_name text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where lower(email) = lower(p_email);
  if v_user_id is null then
    raise exception 'No auth user with email %', p_email;
  end if;

  insert into public.inv_staff (user_id, email, display_name)
  values (v_user_id, lower(p_email), p_display_name)
  on conflict (user_id) do update
    set display_name = coalesce(excluded.display_name, public.inv_staff.display_name);

  return v_user_id;
end;
$$;

-- Only the service role (dashboard SQL editor, server admin client) may call it.
revoke all on function public.inv_add_staff(text, text) from public, anon, authenticated;
