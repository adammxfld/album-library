import { useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import type { Album } from "../albums_data.js";
import "./AlbumSpotlight.scss";

export interface AlbumSpotlightProps {
  album: Album | null;
  onClose: () => void;
}

// Must match the transform transition duration in AlbumSpotlight.scss.
const TRANSITION_MS = 500;

// Swipe-to-close tuning.
const CLOSE_DISTANCE_RATIO = 0.35; // fraction of panel width dragged left to force a close
const FLING_VELOCITY = 0.5; // px/ms; a fast flick closes regardless of distance
const MIN_FLING_SPEED = 0.6; // px/ms floor for the release-animation duration
const SNAP_BACK_MS = 250;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

interface DragState {
  x: number;
  scale: number;
  transitionMs?: number;
}

function AlbumSpotlight({ album, onClose }: AlbumSpotlightProps) {
  const [displayedAlbum, setDisplayedAlbum] = useState(album);
  const [isVisible, setIsVisible] = useState(album !== null);
  const [drag, setDrag] = useState<DragState | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const pointerIdRef = useRef<number | null>(null);
  const startXRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTRef = useRef(0);
  const velocityRef = useRef(0);

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

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isVisible) {
      return;
    }

    pointerIdRef.current = event.pointerId;
    startXRef.current = event.clientX;
    lastXRef.current = event.clientX;
    lastTRef.current = event.timeStamp;
    velocityRef.current = 0;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ x: 0, scale: 1 });
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (pointerIdRef.current !== event.pointerId) {
      return;
    }

    const dt = Math.max(event.timeStamp - lastTRef.current, 1);
    const dx = event.clientX - lastXRef.current;
    const velocity = dx / dt; // px/ms
    const acceleration = (velocity - velocityRef.current) / dt;

    lastXRef.current = event.clientX;
    lastTRef.current = event.timeStamp;
    velocityRef.current = velocity;

    // Only leftward drag moves the panel; dragging right has no effect.
    const totalDx = Math.min(event.clientX - startXRef.current, 0);
    const scale = totalDx < 0 ? 1 - clamp(Math.abs(acceleration) * 0.4, 0, 0) : 1;

    setDrag({ x: totalDx, scale });
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (pointerIdRef.current !== event.pointerId) {
      return;
    }

    pointerIdRef.current = null;

    const panelWidth = panelRef.current?.getBoundingClientRect().width ?? window.innerWidth;
    const totalDx = drag?.x ?? 0;
    const velocity = velocityRef.current; // px/ms, negative = leftward

    const draggedRatio = Math.abs(totalDx) / panelWidth;
    const shouldClose =
      totalDx < 0 && (draggedRatio > CLOSE_DISTANCE_RATIO || velocity < -FLING_VELOCITY);

    if (shouldClose) {
      const offTarget = -(panelWidth + window.innerWidth);
      const remaining = Math.abs(offTarget - totalDx);
      const speed = Math.max(Math.abs(velocity), MIN_FLING_SPEED);
      const durationMs = clamp(remaining / speed, 120, 400);

      setDrag({ x: offTarget, scale: 1, transitionMs: durationMs });

      window.setTimeout(() => {
        setDrag(null);
        onClose();
      }, durationMs);
    } else {
      setDrag({ x: 0, scale: 1, transitionMs: SNAP_BACK_MS });
      window.setTimeout(() => setDrag(null), SNAP_BACK_MS);
    }
  }

  const dragStyle: CSSProperties | undefined = drag
    ? {
        transform: `translateX(${drag.x}px) scale(${drag.scale})`,
        transitionProperty: drag.transitionMs != null ? "transform" : "none",
        transitionDuration: drag.transitionMs != null ? `${drag.transitionMs}ms` : "0s",
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
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
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
