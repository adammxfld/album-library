import { useState } from "react";
import type { Album } from "../albums_data";

export interface UseAlbumFiltersResult {
  tierGroup: number;
  setTierGroup: (tier: number) => void;
  genreSelections: string[];
  handleGenreChange: (genre: string, checked: boolean) => void;
  genreOptions: string[];
  filteredAlbums: Album[];
}

export function useAlbumFilters(albums: Album[]): UseAlbumFiltersResult {
  const [tierGroup, setTierGroup] = useState(1);
  const [genreSelections, setGenreSelections] = useState<string[]>([]);

  function handleGenreChange(genre: string, checked: boolean) {
    setGenreSelections((currentGenres) => {
      if (checked) {
        return [...currentGenres, genre];
      }
      return currentGenres.filter((item) => item !== genre);
    });
  }

  const genreOptions = [...new Set(albums.flatMap((album) => album.genres))];

  const filteredAlbums = albums.filter((album) => {
    const matchesTier = tierGroup === 0 || album.tier === tierGroup;
    const matchesGenres =
      genreSelections.length === 0 ||
      album.genres.some((genre) => genreSelections.includes(genre));

    return matchesTier && matchesGenres;
  });

  return {
    tierGroup,
    setTierGroup,
    genreSelections,
    handleGenreChange,
    genreOptions,
    filteredAlbums,
  };
}
