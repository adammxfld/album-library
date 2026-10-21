import { useState } from "react";
import { usePlaybackPosition } from "../hooks/usePlaybackPosition.ts";
import type { SpotifyPlayerState } from "../hooks/useSpotifyPlayer.ts";
import { playAlbum } from "../spotify/api.ts";
import { login, logout } from "../spotify/auth.ts";
import "./SpotifyPlayer.scss";

export interface SpotifyPlayerProps {
  albumId: string;
  // Accessible name for the embed fallback, e.g. "Artist – Title".
  albumLabel: string;
  spotify: SpotifyPlayerState;
}

function formatMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

function SpotifyPlayer({ albumId, albumLabel, spotify }: SpotifyPlayerProps) {
  const { isConnected, player, deviceId, playback, error, unavailableReason } = spotify;
  const position = usePlaybackPosition(playback);
  const [playError, setPlayError] = useState<string | null>(null);

  // Not connected, or full playback can't work here: keep the preview embed.
  if (!isConnected || unavailableReason) {
    return (
      <div className="spotify-player">
        <iframe
          title={`${albumLabel} on Spotify`}
          src={`https://open.spotify.com/embed/album/${albumId}`}
          width="100%"
          height="80"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        />
        {unavailableReason && <p className="spotify-player__status">{unavailableReason}</p>}
        {isConnected ? (
          <button type="button" className="spotify-player__link" onClick={logout}>
            <span className="icon">-</span><span>Disconnect Spotify</span>
          </button>
        ) : (
          <button type="button" className="spotify-player__link" onClick={() => login()}>
            <span className="icon">+</span><span>Connect Spotify for full playback</span>
          </button>
        )}
      </div>
    );
  }

  // Controls only apply when this album is the one loaded in the player.
  const isThisAlbum = playback?.contextUri === `spotify:album:${albumId}`;
  const message = playError ?? error;

  function handlePlayAlbum() {
    if (!player || !deviceId) return;
    setPlayError(null);
    // Must run inside the click so the browser allows audio to start.
    player.activateElement();
    playAlbum(deviceId, albumId).catch((e: Error) => setPlayError(e.message));
  }

  return (
    <div className={!isThisAlbum ? "spotify-player start-album" : "spotify-player"}>
      {message && <p className="spotify-player__error">{message}</p>}

      {!player || !deviceId ? (
        !message && <p className="spotify-player__status">Connecting to Spotify…</p>
      ) : (
        <>
          {playback && isThisAlbum && (
            <>
              <p className="spotify-player__track">
                <span className="spotify-player__track-name">{playback.track.name}</span>
                <span className="spotify-player__time">
                  {formatMs(position)} / {formatMs(playback.duration)}
                </span>
              </p>
              <div className="player-controls">
                <button type="button" data-icon="prev" onClick={() => { player.previousTrack(); }} aria-label="Previous track">
                  <span className="visually-hidden">Prev</span>
                </button>
                <button
                  type="button"
                  onClick={() => { player.togglePlay(); }}
                  data-icon="play"
                  aria-label={playback.paused ? "play" : "pause"}
                  aria-pressed={playback.paused ? "false" : "true"}>
                  <span className="visually-hidden">{playback.paused ? "Play" : "Pause"}</span>
                </button>
                <button type="button" data-icon="next" onClick={() => { player.nextTrack(); }} aria-label="Next track">
                  <span className="visually-hidden">Next</span>
                </button>
              </div>
            </>
          )}
          {!isThisAlbum && (
            <div className="player-controls">
              <button type="button"
                onClick={handlePlayAlbum}
                data-icon="start-play"
                aria-label="play"
                aria-pressed="false">
                  <span className="visually-hidden">"Play"</span>
              </button>
            </div>
          )}
        </>
      )}

      <button
        type="button"
        className="spotify-player__link"
        onClick={logout}
      >
        <span className="icon">&mdash;</span><span>Disconnect Spotify</span>
      </button>
    </div>
  );
}

export default SpotifyPlayer;
