import type { Album } from "../albums_data.js";
import "./AlbumList.scss";

export interface AlbumListProps {
  albums: Album[];
  selectedAlbum?: Album | null;
  onSelectAlbum?: (album: Album) => void;
}

function AlbumList({ albums, selectedAlbum, onSelectAlbum }: AlbumListProps) {
  const sortedAlbums = [...albums].sort((a, b) =>
    a.title.localeCompare(b.title)
  );

  return (
    <section
      className="library">
      {sortedAlbums.length === 0 ? (
        <div className="album-list no-albums">Nothingness</div>
      ) : (
      <ul className="album-list">
        {sortedAlbums.map((album) => (
          <li
            key={`${album.artist}-${album.title}`}
            className="album-entry"
            style={{ "--theme-color": album.themeColor } as React.CSSProperties}
            aria-current={album === selectedAlbum ? "true" : undefined}
            onClick={() => onSelectAlbum?.(album)}>
              <button>
                <div className="copy-artist">
                  <span>{album.artist}:</span>
                </div>
                <div className="copy-album">
                  <cite>{album.title}</cite>
                </div>
              </button>
              <div className="spine"></div>
              {album?.imageSmall && (
                <img
                  src={album.imageSmall}
                  alt={`${album.artist} - ${album.title}`}
                  draggable={false}
                />
              )}
          </li>
        ))}
      </ul>
      )}
    </section>
  );
}

export default AlbumList;
