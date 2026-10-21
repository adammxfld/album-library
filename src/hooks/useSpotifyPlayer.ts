import { useEffect, useState, useSyncExternalStore } from "react";
import {
  getAccessToken,
  isConnected as getIsConnected,
  logout,
  subscribeToAuth,
} from "../spotify/auth.ts";

const SDK_URL = "https://sdk.scdn.co/spotify-player.js";

export type PlaybackState = {
  paused: boolean;
  // Track position in ms as of receivedAt.
  position: number;
  duration: number;
  // Epoch ms at which Spotify reported this state.
  receivedAt: number;
  // e.g. "spotify:album:{id}" — null when playing outside an album/playlist.
  contextUri: string | null;
  track: {
    uri: string;
    name: string;
    artists: string;
    albumName: string;
    imageUrl: string | null;
  };
};

function toPlaybackState(state: Spotify.PlaybackState): PlaybackState {
  const track = state.track_window.current_track;
  return {
    paused: state.paused,
    position: state.position,
    duration: state.duration,
    receivedAt: Date.now(),
    contextUri: state.context.uri,
    track: {
      uri: track.uri,
      name: track.name,
      artists: track.artists.map((artist) => artist.name).join(", "),
      albumName: track.album.name,
      imageUrl: track.album.images[0]?.url ?? null,
    },
  };
}

let sdkPromise: Promise<void> | null = null;

// Injects the SDK script once; resolves when Spotify signals it is ready.
function loadSdk(): Promise<void> {
  sdkPromise ??= new Promise((resolve, reject) => {
    window.onSpotifyWebPlaybackSDKReady = () => resolve();
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    script.onerror = () => {
      sdkPromise = null;
      reject(new Error("Could not load the Spotify Web Playback SDK"));
    };
    document.head.appendChild(script);
  });
  return sdkPromise;
}

export type SpotifyPlayerState = ReturnType<typeof useSpotifyPlayer>;

// Registers this browser tab as a Spotify Connect device while connected.
// deviceId is set once Spotify reports the device ready; playback is null
// until something is playing on this device. unavailableReason is set when
// full playback can't work here at all, so callers should fall back.
export function useSpotifyPlayer() {
  const isConnected = useSyncExternalStore(subscribeToAuth, getIsConnected);
  const [player, setPlayer] = useState<Spotify.Player | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [playback, setPlayback] = useState<PlaybackState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unavailableReason, setUnavailableReason] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected) return;

    let cancelled = false;
    let instance: Spotify.Player | undefined;
    // False when the last token request came back empty (e.g. offline).
    let gaveToken = false;

    loadSdk()
      .then(() => {
        if (cancelled) return;

        const player = new window.Spotify.Player({
          name: "Album Library",
          // The SDK calls this whenever it needs a token, so it always gets a fresh one.
          getOAuthToken: (cb) => {
            getAccessToken().then((token) => {
              gaveToken = token !== null;
              cb(token ?? "");
            });
          },
          volume: 0.5,
        });

        player.addListener("ready", ({ device_id }) => {
          setError(null);
          setDeviceId(device_id);
        });
        player.addListener("not_ready", () => setDeviceId(null));

        // Fires on play/pause, seek and track change. State is null once
        // playback moves to another device.
        player.addListener("player_state_changed", (state) => {
          setError(null);
          setPlayback(state ? toPlaybackState(state) : null);
        });

        // Browser can't run the SDK (no DRM support, etc.).
        player.addListener("initialization_error", () =>
          setUnavailableReason("Full playback isn't supported in this browser."),
        );
        // Signed in, but not on Premium.
        player.addListener("account_error", () =>
          setUnavailableReason("Full playback needs a Spotify Premium account."),
        );
        // Spotify rejected a real token: end the session so the UI offers
        // Connect again. With no token to give, it's a connection problem.
        player.addListener("authentication_error", () => {
          if (gaveToken) logout();
          else setError("Couldn't reach Spotify. Check your connection and reload.");
        });
        // Recoverable: a track failed to load or play.
        player.addListener("playback_error", ({ message }) => setError(message));

        player.connect();
        instance = player;
        setPlayer(player);
      })
      .catch(() => {
        if (!cancelled) setUnavailableReason("Couldn't load the Spotify player.");
      });

    return () => {
      cancelled = true;
      instance?.disconnect();
      setPlayer(null);
      setDeviceId(null);
      setPlayback(null);
      setError(null);
      setUnavailableReason(null);
    };
  }, [isConnected]);

  return { isConnected, player, deviceId, playback, error, unavailableReason };
}
