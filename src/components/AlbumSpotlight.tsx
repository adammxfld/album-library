import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { Album } from "../albums_data.js";
import { useDrawer } from "../hooks/useDrawer";
import "./AlbumSpotlight.scss";

export interface AlbumSpotlightProps {
  album: Album | null;
  onClose: () => void;
}

// Must match the transform transition duration in AlbumSpotlight.scss.
const TRANSITION_MS = 500;

const CLOSE_DISTANCE_RATIO = 0.35; // fraction of panel width dragged left to force a close

// Derives the Spotify album id from a URL like
// https://open.spotify.com/album/{id}(?si=...) — returns null for missing
// or malformed URLs so callers can fall back gracefully.
function getSpotifyAlbumId(spotifyUrl: string | null): string | null {
  return spotifyUrl?.match(/\/album\/([a-zA-Z0-9]+)/)?.[1] ?? null;
}

function AlbumSpotlight({ album, onClose }: AlbumSpotlightProps) {
  const [displayedAlbum, setDisplayedAlbum] = useState(album);
  const [isVisible, setIsVisible] = useState(album !== null);

  const panelRef = useRef<HTMLDivElement>(null);

  const drawer = useDrawer({
    axis: "x",
    isOpen: isVisible,
    onOpenChange: (open) => {
      if (!open) {
        onClose();
      }
    },
    getOpenValue: () => 0,
    getClosedValue: () =>
      -((panelRef.current?.getBoundingClientRect().width ?? window.innerWidth) + window.innerWidth),
    getDistanceReference: () => panelRef.current?.getBoundingClientRect().width ?? window.innerWidth,
    distanceRatio: CLOSE_DISTANCE_RATIO,
  });

  useEffect(() => {
    // Open (or reopen mid-close — cleanup has already cancelled the clear timer).
    if (album !== null) {
      setDisplayedAlbum(album);
      setIsVisible(true);
      return;
    }

    // Close, keeping the album rendered until the slide-out finishes.
    setIsVisible(false);

    const timer = setTimeout(() => {
      setDisplayedAlbum(null);
    }, TRANSITION_MS);

    return () => clearTimeout(timer);
  }, [album]);

  const spotifyAlbumId = getSpotifyAlbumId(displayedAlbum?.spotifyUrl ?? null);

  const dragStyle: CSSProperties | undefined =
    drawer.value != null
      ? {
          transform: drawer.transform,
          transitionProperty: drawer.transitionMs != null ? "transform" : "none",
          transitionDuration: drawer.transitionMs != null ? `${drawer.transitionMs}ms` : "0s",
        }
      : undefined;

  return (
    <section className="spotlight-panel">
      <div
        className={`album-back-mask${isVisible ? " album-back-mask--visible" : ""}`}
        onClick={onClose}
        aria-hidden={isVisible ? undefined : true}
      />
      <div
        ref={panelRef}
        className={`album-spotlight${isVisible ? " album-spotlight--visible" : ""}`}
        aria-hidden={isVisible ? undefined : true}
        style={dragStyle}
        onPointerDown={isVisible ? drawer.onPointerDown : undefined}
        onPointerMove={drawer.onPointerMove}
        onPointerUp={drawer.onPointerUp}
        onPointerCancel={drawer.onPointerUp}
      >
        <div className="album-artwork">
          {displayedAlbum?.image && (
            <img
              src={displayedAlbum.image}
              alt={`${displayedAlbum.artist} - ${displayedAlbum.title}`}
              draggable={false}
            />
          )}
        </div>
        <ul className="album-info">
          {displayedAlbum && (
            <>
              <li className="album-artist">{displayedAlbum.artist}</li>
              <li className="album-year">{displayedAlbum.year}</li>
              {/* use <i> or something else? */}
              <li className="album-title"><cite>{displayedAlbum.title}</cite></li>
            </>
          )}
        </ul>
        {isVisible && displayedAlbum && spotifyAlbumId && (
          <div className="album-player">
            <iframe
              key={spotifyAlbumId}
              title={`${displayedAlbum.artist} – ${displayedAlbum.title} on Spotify`}
              src={`https://open.spotify.com/embed/album/${spotifyAlbumId}`}
              width="100%"
              height="80"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            />
            
          </div>
        )}
        {isVisible && displayedAlbum && !spotifyAlbumId && (
          <a
            className="album-player-fallback"
            href={displayedAlbum.spotifySearchUrl}
            target="_blank"
            rel="noreferrer"
          >
            Search on Spotify
          </a>
        )}
        <div className="album-case" />
        <div className="cassette" />
      </div>
      {isVisible && (
        <button
          type="button"
          className="album-spotlight-close"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
      )}
    </section>
  );
}

export default AlbumSpotlight;
