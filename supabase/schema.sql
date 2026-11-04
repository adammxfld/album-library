-- Guest Picks schema. Run once on a fresh Supabase project:
-- Supabase dashboard → SQL Editor → paste this file → Run.
--
-- The public site can only read the guest_picks_public view (and guest_picks
-- for realtime). Every write goes through a function that checks the guest's
-- private login name. Login names are never readable publicly.


-- ── Tables ──────────────────────────────────────────────────────────────────

-- Palette: assigned to new guests in position order, wrapping around.
create table public.guest_colors (
  position int primary key,
  hex text not null check (hex ~ '^#[0-9a-fA-F]{6}$')
);

insert into public.guest_colors (position, hex) values
  (1,  '#64649c'),
  (2,  '#4d629d'),
  (3,  '#6798a1'),
  (4,  '#5c9e7c'),
  (5,  '#9c944b'),
  (6,  '#a7aa7b'),
  (7,  '#a96a54'),
  (8,  '#914607'),
  (9,  '#6d322b'),
  (10, '#a05894'),
  (11, '#836f88'),
  (12, '#948488');

create table public.guests (
  id uuid primary key default gen_random_uuid(),
  login_key text not null unique check (char_length(login_key) between 8 and 64), -- lower(trim(login)), private
  display_name text not null check (char_length(display_name) between 1 and 40),  -- public, not unique
  color text not null,
  created_at timestamptz not null default now()
);

create table public.guest_picks (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references public.guests (id) on delete cascade,
  artist text not null check (char_length(artist) between 1 and 200),
  title text not null check (char_length(title) between 1 and 200),
  created_at timestamptz not null default now()
);

create index guest_picks_guest_id_idx on public.guest_picks (guest_id);


-- ── Public view ─────────────────────────────────────────────────────────────

-- What the Guest Picks list reads. Runs with the owner's rights (intentionally
-- not security_invoker), so it can join guests without exposing login_key.
-- guest_id/guest_created_at let the list group picks by guest (display names
-- aren't unique) in the order guests joined. guest_id is safe to expose: every
-- write checks the private login name, not the id.
create view public.guest_picks_public as
select p.id, p.artist, p.title, g.display_name, g.color, p.created_at, g.id as guest_id, g.created_at as guest_created_at
from public.guest_picks p
join public.guests g on g.id = p.guest_id;


-- ── Access rules ────────────────────────────────────────────────────────────

alter table public.guest_colors enable row level security;
alter table public.guests enable row level security;
alter table public.guest_picks enable row level security;

-- guest_picks is readable only so realtime can announce changes; it holds no
-- login names. guests and guest_colors have no policies, so they're private.
create policy "Public read" on public.guest_picks for select to anon, authenticated using (true);

revoke all on public.guest_colors, public.guests, public.guest_picks, public.guest_picks_public
  from anon, authenticated;
grant select on public.guest_picks, public.guest_picks_public to anon, authenticated;


-- ── Functions (the only way to write) ───────────────────────────────────────

-- Returns the guest's display name + color, or no rows if the login is unknown.
create or replace function public.sign_in_guest(p_login text)
returns table (display_name text, color text)
language sql
stable
security definer
set search_path = ''
as $$
  select g.display_name, g.color
  from public.guests g
  where g.login_key = lower(btrim(coalesce(p_login, '')));
$$;

-- Creates a guest with the next palette color.
create or replace function public.create_guest(p_login text, p_display_name text)
returns table (display_name text, color text)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_key text := lower(btrim(coalesce(p_login, '')));
  v_name text := btrim(coalesce(p_display_name, ''));
  v_guest_count int;
  v_color_count int;
  v_color text;
begin
  if char_length(v_key) not between 8 and 64 then
    raise exception 'Login name must be 8–64 characters';
  end if;
  if char_length(v_name) not between 1 and 40 then
    raise exception 'Display name must be 1–40 characters';
  end if;

  -- One creation at a time, so two new guests can't take the same color slot.
  perform pg_advisory_xact_lock(hashtext('create_guest'));

  if exists (select 1 from public.guests g where g.login_key = v_key) then
    raise exception 'Login name already taken';
  end if;

  select count(*) into v_guest_count from public.guests;
  select count(*) into v_color_count from public.guest_colors;

  select c.hex into v_color
  from public.guest_colors c
  order by c.position
  offset v_guest_count % greatest(v_color_count, 1)
  limit 1;

  return query
    insert into public.guests (login_key, display_name, color)
    values (v_key, v_name, coalesce(v_color, '#888888'))
    returning guests.display_name, guests.color;
end;
$$;

-- The guest's own picks, for the submission page.
create or replace function public.my_guest_picks(p_login text)
returns table (id uuid, artist text, title text, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.artist, p.title, p.created_at
  from public.guest_picks p
  join public.guests g on g.id = p.guest_id
  where g.login_key = lower(btrim(coalesce(p_login, '')))
  order by p.created_at;
$$;

-- Adds a pick, enforcing the 25-pick cap.
create or replace function public.add_guest_pick(p_login text, p_artist text, p_title text)
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
    insert into public.guest_picks (guest_id, artist, title)
    values (v_guest_id, v_artist, v_title)
    returning guest_picks.id, guest_picks.artist, guest_picks.title, guest_picks.created_at;
end;
$$;

-- Deletes a pick only if it belongs to this login.
create or replace function public.delete_guest_pick(p_login text, p_pick_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.guest_picks p
  using public.guests g
  where p.id = p_pick_id
    and p.guest_id = g.id
    and g.login_key = lower(btrim(coalesce(p_login, '')));

  if not found then
    raise exception 'Pick not found';
  end if;
end;
$$;

revoke execute on function
  public.sign_in_guest(text),
  public.create_guest(text, text),
  public.my_guest_picks(text),
  public.add_guest_pick(text, text, text),
  public.delete_guest_pick(text, uuid)
  from public;

grant execute on function
  public.sign_in_guest(text),
  public.create_guest(text, text),
  public.my_guest_picks(text),
  public.add_guest_pick(text, text, text),
  public.delete_guest_pick(text, uuid)
  to anon, authenticated;


-- ── Live updates ────────────────────────────────────────────────────────────

-- Announces adds/deletes; the Guest Picks list re-fetches the public view.
alter publication supabase_realtime add table public.guest_picks;
