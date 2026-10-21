import { useState } from "react";
import type { Album } from "../albums_data";

export type SortOrder = "alphabetical" | "random";

export interface UseAlbumFiltersResult {
  tierGroup: number;
  setTierGroup: (tier: number) => void;
  sortOrder: SortOrder;
  setSortOrder: (order: SortOrder) => void;
  genreSelections: string[];
  handleGenreChange: (genre: string, checked: boolean) => void;
  clearGenres: () => void;
  genreOptions: string[];
  filteredAlbums: Album[];
}

function randomizeRanks(albums: Album[]): Map<Album, number> {
  return new Map(albums.map((album) => [album, Math.random()]));
}

export function useAlbumFilters(albums: Album[]): UseAlbumFiltersResult {
  const [tierGroup, setTierGroup] = useState(1);
  const [genreSelections, setGenreSelections] = useState<string[]>([]);
  const [sortOrder, setSortOrderState] = useState<SortOrder>("random");
  // A random rank per album, regenerated each time random order is chosen.
  const [randomRanks, setRandomRanks] = useState(() => randomizeRanks(albums));

  function setSortOrder(order: SortOrder) {
    if (order === "random") {
      setRandomRanks(randomizeRanks(albums));
    }
    setSortOrderState(order);
  }

  function handleGenreChange(genre: string, checked: boolean) {
    setGenreSelections((currentGenres) => {
      if (checked) {
        return [...currentGenres, genre];
      }
      return currentGenres.filter((item) => item !== genre);
    });
  }

  function clearGenres() {
    setGenreSelections([]);
  }

  const genreOptions = [...new Set(albums.flatMap((album) => album.genres))];

  const filteredAlbums = albums.filter((album) => {
    const matchesTier = tierGroup === 0 || album.tier === tierGroup;
    const matchesGenres =
      genreSelections.length === 0 ||
      album.genres.some((genre) => genreSelections.includes(genre));

    return matchesTier && matchesGenres;
  }).sort((a, b) =>
    sortOrder === "random"
      ? (randomRanks.get(a) ?? 0) - (randomRanks.get(b) ?? 0)
      : a.title.localeCompare(b.title)
  );

  return {
    tierGroup,
    setTierGroup,
    sortOrder,
    setSortOrder,
    genreSelections,
    handleGenreChange,
    clearGenres,
    genreOptions,
    filteredAlbums,
  };
}
