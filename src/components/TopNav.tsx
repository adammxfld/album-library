import logoCassette from "../assets/logo-cassette.png";
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
      {/* <img
        className="logo"
        src={logoCassette}
        alt="Cassette logo"
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
      /> */}
      <div className="intro">
        <p className="headline">
          <img className="headline-logo" src={logo} alt="" draggable={false} />
          <span className="logoletter1">L</span><span className="logoletter2">L</span><span className="logoletter2">L</span><span className="title">LongPlayers</span>
        </p>
        {/* <p className="subtext">... I took it too far, Felix</p> */}
      </div>
      <SortFilter sortOrder={sortOrder} onSortOrderChange={onSortOrderChange} />
    </header>
  );
}

export default TopNav;
