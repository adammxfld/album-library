import type { Album } from "../albums_data.js";
import "./AlbumList.scss";

export interface AlbumListProps {
  albums: Album[];
}

function AlbumList({ albums }: AlbumListProps) {
  return (
    <ol className="album-list">
      {albums.map((album) => (
        <li key={`${album.artist}-${album.title}`} className="album-entry">
          {album.artist} — {album.title}
        </li>
      ))}
    </ol>
  );
}

export default AlbumList;
