-- Adds album art to guest picks. Run once on the existing project:
-- Supabase dashboard → SQL Editor → paste this file → Run.
-- (schema.sql already includes these changes for fresh projects.)

-- Only Apple's artwork host is accepted, so a guest can't store an arbitrary image URL.
alter table public.guest_picks
  add column image_small text
  check (image_small is null or image_small ~ '^https://is[0-9]+-ssl\.mzstatic\.com/');

-- New columns can only be appended to an existing view, so image_small goes last.
create or replace view public.guest_picks_public as
select p.id, p.artist, p.title, g.display_name, g.color, p.created_at, g.id as guest_id, g.created_at as guest_created_at, p.image_small
from public.guest_picks p
join public.guests g on g.id = p.guest_id;

-- Adding a parameter changes the function's signature, so drop the old one first.
drop function public.add_guest_pick(text, text, text);

-- Adds a pick, enforcing the 25-pick cap. p_image is optional album art.
create or replace function public.add_guest_pick(p_login text, p_artist text, p_title text, p_image text default null)
returns table (id uuid, artist text, title text, created_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_key text := lower(btrim(coalesce(p_login, '')));
  v_artist text := btrim(coalesce(p_artist, ''));
  v_title text := btrim(coalesce(p_title, ''));
  v_image text := nullif(btrim(coalesce(p_image, '')), '');
  v_guest_id uuid;
begin
  if v_artist = '' or v_title = '' then
    raise exception 'Artist and album are required';
  end if;

  -- Lock the guest row so simultaneous adds can't exceed the cap.
  select g.id into v_guest_id from public.guests g where g.login_key = v_key for update;
  if v_guest_id is null then
    raise exception 'Unknown login name';
  end if;

  if (select count(*) from public.guest_picks p where p.guest_id = v_guest_id) >= 25 then
    raise exception 'Limit of 25 picks reached';
  end if;

  return query
    insert into public.guest_picks (guest_id, artist, title, image_small)
    values (v_guest_id, v_artist, v_title, v_image)
    returning guest_picks.id, guest_picks.artist, guest_picks.title, guest_picks.created_at;
end;
$$;

revoke execute on function public.add_guest_pick(text, text, text, text) from public;
grant execute on function public.add_guest_pick(text, text, text, text) to anon, authenticated;
