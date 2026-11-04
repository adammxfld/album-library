import { useMediaQuery } from '../hooks/useMediaQuery.ts';
import "./GenreFilter.scss";

export interface GenreFilterProps {
  genres: string[];
  selectedGenres: string[];
  onGenreChange: (genre: string, checked: boolean) => void;
  onClearGenres: () => void;
  disabled?: boolean; // e.g. Guest Picks, which has no genres
}

function GenreFilter({ genres, selectedGenres, onGenreChange, onClearGenres, disabled = false }: GenreFilterProps) {
  const isLargeScreen = useMediaQuery("(min-width: 768px)");

  return (
    <form className={`genre-filter${disabled ? " disabled" : ""}`} aria-disabled={disabled}>
      {isLargeScreen && (
        <h3>Filter by genre</h3>
      )}
      <button
        type="button"
        className="btn-clear"
        disabled={disabled || selectedGenres.length === 0}
        onClick={onClearGenres}>
        <span>clear filters</span>
      </button>
      {genres.map((genre) => (
        <label key={genre}>
          <input
            type="checkbox"
            disabled={disabled}
            checked={selectedGenres.includes(genre)}
            onChange={(e) => onGenreChange(genre, e.target.checked)} />
          {genre}
        </label>
      ))}
    </form>
  );
}

export default GenreFilter;
