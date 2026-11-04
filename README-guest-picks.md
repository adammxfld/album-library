# Guest Picks

A shared album list that guests contribute to. Everyone's picks appear together in one list, color-coded by guest, and update live.

## Architecture

- **Frontend:** the existing static React + Vite app, plus one new page (`guest-submission.html`).
- **Backend:** [Supabase](https://supabase.com) — hosted Postgres database + realtime. No custom server, no auth system.
- **Access rules:** the website can only *read* public data. Every write goes through a database function that checks the guest's login name.
- **Admin:** view and edit all data in the Supabase Table Editor.
- **Hosting:** static, as before. The build adds `guest-submission.html`, `guest-submission.js`, its CSS, and shared chunks (`album-feature-src.js` / `.css`) — upload them all alongside `index.html`.

## Identity (lightweight, trust-based)

- **Login name** — private handle used to sign in. Unique (case/space-insensitive), minimum 8 characters. Acts like a simple shared secret.
- **Display name** — shown publicly in the list. Not unique. Can't be changed by guests (editable in the dashboard).
- **Color** — assigned automatically from a 12-color palette on creation, in order, wrapping around. Never changes.
- The login name is saved in localStorage so returning guests skip sign-in.

## Data model

| Table | Columns | Public? |
|---|---|---|
| `guest_colors` | position, hex | No |
| `guests` | id, login_key, display_name, color, created_at | No |
| `guest_picks` | id, guest_id, artist, title, created_at | No |
| `guest_picks_public` (view) | pick id, artist, title, display_name, color, created_at, guest_id, guest_created_at | Read-only |

Login names are never exposed publicly. `guest_id` is safe to expose — every write checks the login name, not the id.

## Database functions

| Function | Does |
|---|---|
| `sign_in_guest(login)` | Returns display name + color, or "not found" |
| `create_guest(login, display_name)` | Validates, assigns next color, creates guest |
| `my_guest_picks(login)` | Returns that guest's picks |
| `add_guest_pick(login, artist, title)` | Adds a pick; max 25 per guest |
| `delete_guest_pick(login, pick_id)` | Deletes a pick only if it's theirs |

## Pages

**Main view (existing)**
- **Guest Picks** button in the tier filter.
- Shows all picks via the existing `AlbumList`, each row in its guest's color with their display name.
- A **+ your picks** link at the top of the list opens the submission page.
- Default order: grouped by guest (in the order guests joined), albums alphabetical by title within each guest. Alphabetical or random sorting overrides the grouping; clicking the active sort again returns to grouped.
- Read-only. Loading dots while the list loads. Genre filters are greyed out and Spotlight is off in this mode.

**Guest submission (`guest-submission.html`)**
1. Enter login name.
2. Existing → "Continue as *display name*?" New → enter a display name.
3. Artist + album fields with an **Add** button (disabled when empty or at 25; shows "n / 25").
4. Your picks as a text list, one `<li>` per "artist: album", each with an **×** to delete. Editing = delete and re-add.

A **to albums** link returns to the main view. Styled with [Pico CSS](https://picocss.com) (this page only).

## Live updates

Supabase Realtime announces when a pick is added or deleted. The Guest Picks list re-fetches the public view.

## Files

| File | Does |
|---|---|
| `supabase/schema.sql` | Whole database: tables, palette, rules, view, functions, realtime |
| `src/guestPicks/api.ts` | Supabase client, data calls, saved login |
| `src/guestPicks/useGuestPicks.ts` | Main-view list: loading, live updates, grouping and sorting |
| `src/guestPicks/GuestPicks.tsx` | List header with the "+ your picks" link |
| `src/guestPicks/main.tsx` | Submission page entry (loads Pico) |
| `src/guestPicks/GuestSubmission.tsx` | Submission page: which screen shows, header |
| `SignInForm`, `ConfirmGuest`, `NewGuestForm`, `MyPicks` | The submission page's screens |
| `src/guestPicks/useRequest.ts` | Busy state + readable errors for requests |

## Rebuilding the database

- `schema.sql` runs only on an empty project (it doesn't drop or replace existing tables).
- It holds no data — export `guests` then `guest_picks` to CSV first, and import them in that order.
- A new project has a new URL and publishable key — update `.env` and `.env.production`, then rebuild.

## Build steps

1. ✅ **Supabase** — create project; run `supabase/schema.sql`.
2. ✅ **Wiring** — add `@supabase/supabase-js`, public URL + key env vars, and a small data module.
3. ✅ **Submission page** — second Vite entry, sign-in, form, own-picks list.
4. ✅ **Main view** — Guest Picks tier option, list source swap, live updates.
5. **Test and deploy** — two browsers, cap, deletes, live updates; upload the new files.

## Later

- Change display name or login name
- Filter by guest, color legend
- Profanity filter, rate limiting
- Merge duplicate albums
