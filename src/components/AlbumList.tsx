import type { Album } from "../albums_data.js";
import "./AlbumList.scss";

export interface AlbumListProps {
  albums: Album[];
}

function AlbumList({ albums }: AlbumListProps) { 
  const sortedAlbums = [...albums].sort((a, b) =>
    a.title.localeCompare(b.title)
  );

  return (
    <ul className="album-list">
      {sortedAlbums.map((album) => (
        <li 
          key={`${album.artist}-${album.title}`}
          className="album-entry glass"
          style={{ "--theme-color": album.themeColor } as React.CSSProperties}>
            <div className="copy-artist">
              <span>{album.artist}:</span>
            </div>
            <div className="copy-album">
              <i>{album.title}</i>
            </div>
        </li>
      ))}
    </ul>
  );
}

export default AlbumList;
