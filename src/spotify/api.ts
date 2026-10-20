import { getAccessToken } from "./auth.ts";

// Derives the Spotify album id from a URL like
// https://open.spotify.com/album/{id}(?si=...) — returns null for missing
// or malformed URLs so callers can fall back gracefully.
export function getSpotifyAlbumId(spotifyUrl: string | null): string | null {
  return spotifyUrl?.match(/\/album\/([a-zA-Z0-9]+)/)?.[1] ?? null;
}

const PLAY_ERRORS: Record<number, string> = {
  401: "Your Spotify session expired. Reconnect to keep listening.",
  403: "Spotify wouldn't start playback on this account.",
  404: "The Spotify player went offline. Reload the page and try again.",
  429: "Spotify is busy. Try again in a moment.",
};

// Starts the album from track 1 on the given Connect device.
export async function playAlbum(deviceId: string, albumId: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error("Spotify is not connected");

  const response = await fetch(
    `https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(deviceId)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ context_uri: `spotify:album:${albumId}` }),
    },
  );

  if (!response.ok) {
    console.error("Spotify play failed", response.status, await response.text());
    throw new Error(
      PLAY_ERRORS[response.status] ??
        `Spotify couldn't start playback (${response.status}).`,
    );
  }
}
