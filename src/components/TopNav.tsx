import logoCassette from "../assets/logo-cassette.png";
import "./TopNav.scss";

function TopNav() {
  return (
    <header className="top-nav">
      <img
        className="logo"
        src={logoCassette}
        alt="Cassette logo"
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
      />
      <div className="intro">
      <p className="headline">
        Albums for listening in full
      </p>
      <p className="subtext">... I took it too far, Felix</p>
      </div>
    </header>
  );
}

export default TopNav;
