# Album Feature

- A React + Vite + TypeScript album library with full-album Spotify playback.
- For exploring a curated music library.
- Retro design.

## Spotify playback

- **Auth:** Authorization Code with PKCE (`src/spotify/auth.ts`). No client secret in the frontend; tokens refresh automatically.
- **Player:** Web Playback SDK makes the browser a Spotify device (`src/hooks/useSpotifyPlayer.ts`).
- **Playback:** Web API starts the album on that device (`src/spotify/api.ts`).
- **Fallback:** when not connected, or for non-Premium accounts, the Spotify embed is shown instead.

Requires Spotify Premium. While the app is in Spotify's Development Mode, only users listed under **User Management** in the Spotify dashboard can connect.

## Setup

1. In the Spotify dashboard, enable **Web API** and **Web Playback SDK**, then add these redirect URIs:
   - `http://127.0.0.1:5173/`
   - `https://adammaxfield.com/projects/album-feature/`
2. Add to `.env` (gitignored):
   ```
   VITE_SPOTIFY_CLIENT_ID=your_client_id
   VITE_SPOTIFY_REDIRECT_URI=http://127.0.0.1:5173/
   ```
   `.env.production` (committed) sets the production redirect URI.
3. `npm install`, then `npm run dev` and open http://127.0.0.1:5173/ (Spotify rejects `localhost`).

## Build

`npm run build` writes to `dist-embed/`.

> Never put secrets in `VITE_` variables, because they're bundled into the frontend. `SPOTIFY_CLIENT_SECRET` in `.env` is only for the Node scripts in `scripts/`.
