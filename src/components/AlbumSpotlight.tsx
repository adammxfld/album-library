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
    // Open only if the spotlight is currently closed.
    if (displayedAlbum === null && album !== null) {
      setDisplayedAlbum(album);
      setIsVisible(true);
      return;
    }

    // Close the currently displayed album.
    if (album === null && displayedAlbum !== null) {
      setIsVisible(false);

      const timer = setTimeout(() => {
        setDisplayedAlbum(null);
      }, TRANSITION_MS);

      return () => clearTimeout(timer);
    }
  }, [album, displayedAlbum]);

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
              <li className="album-title"><i>{displayedAlbum.title}</i></li>
            </>
          )}
        </ul>
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
