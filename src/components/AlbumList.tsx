import LoadingDots from "./LoadingDots.tsx";
import "./AlbumList.scss";

// What a row needs. Library albums fit as-is; guest picks add an id (duplicates
// are allowed) and the guest's display name.
export interface AlbumListEntry {
  id?: string;
  artist: string;
  title: string;
  themeColor: string | null;
  imageSmall?: string | null;
  displayName?: string;
}

export interface AlbumListProps<T extends AlbumListEntry> {
  albums: T[];
  selectedAlbum?: T | null;
  onSelectAlbum?: (album: T) => void;
  header?: React.ReactNode; // shown at the top of .album-list, even when it's empty
  isLoading?: boolean; // shows loading dots instead of the empty message
}

function AlbumList<T extends AlbumListEntry>({ albums, selectedAlbum, onSelectAlbum, header, isLoading = false }: AlbumListProps<T>) {
  return (
    <section
      className="library">
      {albums.length === 0 ? (
        // "no-albums" only once there's an answer (or a failure), not while loading.
        <div className={`album-list ${isLoading ? "loading" : "no-albums"}`}>
          {header && <div className="album-list-header">{header}</div>}
          {isLoading ? <LoadingDots /> : <div className="no-albums-message">Nothingness</div>}
        </div>
      ) : (
      <ul className="album-list">
        {header && <li className="album-list-header">{header}</li>}
        {albums.map((album) => (
          <li
            key={album.id ?? `${album.artist}-${album.title}`}
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
                {album.displayName && (
                  <div className="copy-guest">{album.displayName}</div>
                )}
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
