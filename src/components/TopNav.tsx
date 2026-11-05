import { useState } from "react";
import logo from "../assets/logo.png";
import type { SortOrder } from "../hooks/useAlbumFilters";
import InfoOverlay from "./InfoOverlay";
import SortFilter from "./SortFilter";
import "./TopNav.scss";

type TopNavProps = {
  sortOrder: SortOrder | null;
  onSortOrderChange: (order: SortOrder) => void;
}

function TopNav({ sortOrder, onSortOrderChange }: TopNavProps) {
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  return (
    <header className="top-nav">
      <div className="intro">
        <h1 className="headline">
          <img 
            className="logo" 
            src={logo} 
            alt="Unicorn kid" 
            draggable={false}
            onContextMenu={(e) => e.preventDefault()} 
          />
          <span aria-hidden="true">L
            <span className="logo-letters">L</span>
            <span className="logo-letters">L</span>
            <span className="logo-letters">L</span>
          </span>
          <span
            className="title"
            role="button"
            tabIndex={0}
            aria-haspopup="dialog"
            onClick={() => setIsInfoOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsInfoOpen(true);
              }
            }}>
            LongPlayers
          </span>
        </h1>
      </div>
      <SortFilter sortOrder={sortOrder} onSortOrderChange={onSortOrderChange} />
      {isInfoOpen && <InfoOverlay onClose={() => setIsInfoOpen(false)} />}
    </header>
  );
}

export default TopNav;
