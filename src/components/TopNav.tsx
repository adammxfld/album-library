import logo from "../assets/logo.png";
import type { SortOrder } from "../hooks/useAlbumFilters";
import SortFilter from "./SortFilter";
import "./TopNav.scss";

type TopNavProps = {
  sortOrder: SortOrder;
  onSortOrderChange: (order: SortOrder) => void;
}

function TopNav({ sortOrder, onSortOrderChange }: TopNavProps) {
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
          <span className="title">LongPlayers</span>
        </h1>
      </div>
      <SortFilter sortOrder={sortOrder} onSortOrderChange={onSortOrderChange} />
    </header>
  );
}

export default TopNav;
