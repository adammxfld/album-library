import { useMediaQuery } from '../hooks/useMediaQuery.ts';
import "./GenreFilter.scss";

export interface GenreFilterProps {
  genres: string[];
  selectedGenres: string[];
  onGenreChange: (genre: string, checked: boolean) => void;
  onClearGenres: () => void;
}

function GenreFilter({ genres, selectedGenres, onGenreChange, onClearGenres }: GenreFilterProps) {
  const isLargeScreen = useMediaQuery("(min-width: 768px)");

  return (
    <form className="genre-filter">
      {isLargeScreen && (
        <h3>Filter by genre</h3>
      )}
      {genres.map((genre) => (
        <label key={genre}>
          <input
            type="checkbox"
            checked={selectedGenres.includes(genre)}
            onChange={(e) => onGenreChange(genre, e.target.checked)} />
          {genre}
        </label>
      ))}
      <button
        type="button"
        className="btn-clear"
        disabled={selectedGenres.length === 0}
        onClick={onClearGenres}>
        Clear filters
      </button>
    </form>
  );
}

export default GenreFilter;
