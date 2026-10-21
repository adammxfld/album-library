import { useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import TierFilter from "./TierFilter";
import GenreFilter from "./GenreFilter";
import { useDrawer } from "../hooks/useDrawer";
import "./Filters.scss"
import { useMediaQuery } from "../hooks/useMediaQuery";

export interface FiltersProps {
  tierGroup: number;
  onTierChange: (tier: number) => void;
  genres: string[];
  selectedGenres: string[];
  onGenreChange: (genre: string, checked: boolean) => void;
  onClearGenres: () => void;
}
// Must match Filters.scss: nav height, and height minus --nav-offset when closed.
const CLOSED_HEIGHT_VH = 19;
const OPEN_HEIGHT_VH = 75;
const LARGE_SCREEN_QUERY = "(min-width: 768px)";
const LARGE_CLOSED_HEIGHT_VH = 15;
const LARGE_OPEN_HEIGHT_VH = 45;
const OPEN_DISTANCE_RATIO = 0.05; // fraction of the open/closed travel dragged to force a toggle
const SWIPE_PX = 30; // vertical distance that counts as a hide/show swipe

function vhToPx(vh: number) {
  return (window.innerHeight * vh) / 100;
}

// How far nav (fixed height) has to translate to go from fully open (0) to
// closed (only the closed height peeking above the viewport bottom).
function travelPx() {
  return window.matchMedia(LARGE_SCREEN_QUERY).matches
    ? vhToPx(LARGE_OPEN_HEIGHT_VH - LARGE_CLOSED_HEIGHT_VH)
    : vhToPx(OPEN_HEIGHT_VH - CLOSED_HEIGHT_VH);
}

function Filters({ tierGroup, onTierChange, genres, selectedGenres, onGenreChange, onClearGenres }: FiltersProps) {
  const isLargeScreen = useMediaQuery("(min-width: 768px)");
  const [isOpen, setIsOpen] = useState(false);
  // Swiped down from the default strip so only the handle shows.
  const [isHidden, setIsHidden] = useState(false);
  const swipeStartY = useRef<number | null>(null);

  // The hook's "value" is a reveal amount (0 = closed, travelPx() = fully
  // open), not the literal translateY offset — translateY is the complement
  // of that (see dragStyle below), so open still has to be the larger value
  // for the hook's fling-direction logic to read the gesture correctly.
  const drawer = useDrawer({
    axis: "y",
    isOpen,
    onOpenChange: setIsOpen,
    getOpenValue: () => travelPx(),
    getClosedValue: () => 0,
    distanceRatio: OPEN_DISTANCE_RATIO,
    invert: true, // nav is anchored to the bottom, so drag up opens
  });

  const dragStyle: CSSProperties | undefined =
    drawer.value != null
      ? ({
          "--nav-offset": `${travelPx() - drawer.value}px`,
          "--nav-transition-duration": drawer.transitionMs != null ? `${drawer.transitionMs}ms` : "0s",
        } as CSSProperties)
      : undefined;

  // Closed → swipe down hides; hidden → swipe up restores the strip.
  function handleSwipeEnd(e: ReactPointerEvent<HTMLElement>) {
    const startY = swipeStartY.current;
    swipeStartY.current = null;
    if (startY == null || isOpen) return;
    const dy = e.clientY - startY;
    if (!isHidden && dy > SWIPE_PX) setIsHidden(true);
    if (isHidden && dy < -SWIPE_PX) setIsHidden(false);
  }

  function toggleFromHandle() {
    // A tap on the hidden panel restores the strip rather than opening fully.
    if (isHidden) setIsHidden(false);
    else setIsOpen(!isOpen);
  }

  return (
    <nav
      className={isOpen ? "open" : isHidden ? "hidden" : undefined}
      style={dragStyle}
      onPointerDown={(e) => {
        // Large screens toggle via the handle only, no dragging
        if (window.matchMedia(LARGE_SCREEN_QUERY).matches) {
          return;
        }
        swipeStartY.current = e.clientY;
        // While hidden, don't let the drawer read an upward swipe as "open fully".
        if (!isHidden) drawer.onPointerDown(e);
      }}
      onPointerMove={drawer.onPointerMove}
      onPointerUp={(e) => {
        drawer.onPointerUp(e);
        handleSwipeEnd(e);
      }}
      onPointerCancel={(e) => {
        drawer.onPointerUp(e);
        swipeStartY.current = null;
      }}
    >
      <div
        className="open-handle"
        role="button"
        tabIndex={0}
        aria-label={isOpen ? "Close filters" : isHidden ? "Show filters" : "Open filters"}
        aria-expanded={isOpen}
        onClick={toggleFromHandle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleFromHandle();
          }
        }}
      >
        <span className="open-chevron" />
      </div>
      {!isLargeScreen && (
        <TierFilter tierGroup={tierGroup} setTierGroup={onTierChange} />
      )}
      <GenreFilter
        genres={genres}
        selectedGenres={selectedGenres}
        onGenreChange={onGenreChange}
        onClearGenres={onClearGenres}
      />
    </nav>
  );
}

export default Filters;
