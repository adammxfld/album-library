import "./GenreFilter.scss";

export interface GenreFilterProps {
  genres: string[];
  selectedGenres: string[];
  onGenreChange: (genre: string, checked: boolean) => void;
}

function GenreFilter({ genres, selectedGenres, onGenreChange }: GenreFilterProps) {
  return (
    <form id="genre-filter">
      {genres.map((genre) => (
        <label key={genre}>
          <input
            type="checkbox"
            checked={selectedGenres.includes(genre)}
            onChange={(e) => onGenreChange(genre, e.target.checked)} />
          {genre}
        </label>
      ))}
    </form>
  );
}

export default GenreFilter;
