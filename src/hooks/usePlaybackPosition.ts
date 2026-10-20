import { useEffect, useState } from "react";
import type { PlaybackState } from "./useSpotifyPlayer.ts";

const TICK_MS = 500;

// Live track position in ms. Spotify only reports position when something
// changes, so while playing we advance it locally from the last report.
export function usePlaybackPosition(playback: PlaybackState | null): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!playback || playback.paused) return;
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, [playback]);

  if (!playback) return 0;
  if (playback.paused) return playback.position;

  const elapsed = Math.max(0, now - playback.receivedAt);
  return Math.min(playback.duration, playback.position + elapsed);
}
