import { albums } from "../albums_data";
  import "./GenreFilter.scss";

  type GenreProps = {
    onGenreChange: (genre: string, checked: boolean) => void;
  };

  const genreAssortment = [
    ...new Set(albums.flatMap((album) => album.genres))
  ]

  function GenreFilter({onGenreChange}: GenreProps) {

    return (
      <form id="genre-filter">
        {genreAssortment.map((genre) => (
          <label key={genre}>
            <input
              type="checkbox"
              onChange={(e) => onGenreChange(genre, e.target.checked)}/>
            {genre}
          </label>
        ))}
      </form>
    );
  }

  export default GenreFilter;
