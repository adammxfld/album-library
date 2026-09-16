import TierFilter from "./TierFilter";
import GenreFilter from "./GenreFilter";
import "./Filters.scss"

export interface FiltersProps {
  tierGroup: number;
  onTierChange: (tier: number) => void;
  genres: string[];
  selectedGenres: string[];
  onGenreChange: (genre: string, checked: boolean) => void;
}

function Filters({ tierGroup, onTierChange, genres, selectedGenres, onGenreChange }: FiltersProps) {
  return (
    <nav>
      <TierFilter tierGroup={tierGroup} setTierGroup={onTierChange} />
      <GenreFilter
        genres={genres}
        selectedGenres={selectedGenres}
        onGenreChange={onGenreChange}
      />
    </nav>
  );
}

export default Filters;
