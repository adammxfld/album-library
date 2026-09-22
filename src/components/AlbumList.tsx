import type { Album } from "../albums_data.js";
import "./AlbumList.scss";

export interface AlbumListProps {
  albums: Album[];
  onSelectAlbum?: (album: Album) => void;
}

function AlbumList({ albums, onSelectAlbum }: AlbumListProps) {
  const sortedAlbums = [...albums].sort((a, b) =>
    a.title.localeCompare(b.title)
  );

  return (
    <section className="library">
      <ul className="album-list">
        {sortedAlbums.map((album) => (
          <li
            key={`${album.artist}-${album.title}`}
            className="album-entry"
            style={{ "--theme-color": album.themeColor } as React.CSSProperties}
            onClick={() => onSelectAlbum?.(album)}>
              <div className="spine"></div>
              <div className="copy-artist">
                <span>{album.artist}:</span>
              </div>
              <div className="copy-album">
                <i>{album.title}</i>
              </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default AlbumList;
