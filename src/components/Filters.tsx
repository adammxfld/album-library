import { useState } from "react";
import type { CSSProperties } from "react";
import TierFilter from "./TierFilter";
import GenreFilter from "./GenreFilter";
import { useDrawer } from "../hooks/useDrawer";
import "./Filters.scss"

export interface FiltersProps {
  tierGroup: number;
  onTierChange: (tier: number) => void;
  genres: string[];
  selectedGenres: string[];
  onGenreChange: (genre: string, checked: boolean) => void;
}

const CLOSED_HEIGHT_VH = 19;
const OPEN_HEIGHT_VH = 75;
const OPEN_DISTANCE_RATIO = 0.05; // fraction of the open/closed travel dragged to force a toggle

function vhToPx(vh: number) {
  return (window.innerHeight * vh) / 100;
}

function Filters({ tierGroup, onTierChange, genres, selectedGenres, onGenreChange }: FiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const drawer = useDrawer({
    axis: "y",
    isOpen,
    onOpenChange: setIsOpen,
    getOpenValue: () => vhToPx(OPEN_HEIGHT_VH),
    getClosedValue: () => vhToPx(CLOSED_HEIGHT_VH),
    distanceRatio: OPEN_DISTANCE_RATIO,
  });

  const dragStyle: CSSProperties | undefined =
    drawer.value != null
      ? ({
          "--nav-height": `${drawer.value}px`,
          "--nav-transition-duration": drawer.transitionMs != null ? `${drawer.transitionMs}ms` : "0s",
        } as CSSProperties)
      : undefined;

  return (
    <nav
      className={isOpen ? "open" : undefined}
      style={dragStyle}
      onPointerDown={drawer.onPointerDown}
      onPointerMove={drawer.onPointerMove}
      onPointerUp={drawer.onPointerUp}
      onPointerCancel={drawer.onPointerUp}
    >
      <TierFilter tierGroup={tierGroup} setTierGroup={onTierChange} />
      <GenreFilter
        genres={genres}
        selectedGenres={selectedGenres}
        onGenreChange={onGenreChange}
      />
    </nav>
  );
}

export default Filters;
