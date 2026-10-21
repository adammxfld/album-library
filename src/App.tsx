import AlbumList from './components/AlbumList.js'
import AlbumSpotlight from './components/AlbumSpotlight.js'
import Filters from './components/Filters.tsx'
import TopNav from './components/TopNav.tsx'
import { albums, type Album } from "./albums_data.ts";
import { useState } from 'react';
import { useAlbumFilters } from './hooks/useAlbumFilters.ts';
import TierFilter from './components/TierFilter.tsx';
import { useMediaQuery } from './hooks/useMediaQuery.ts';
import { useSpotifyPlayer } from './hooks/useSpotifyPlayer.ts';
import './App.scss';

function App() {
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const isLargeScreen = useMediaQuery("(min-width: 768px)");
  const {
    tierGroup,
    setTierGroup,
    sortOrder,
    setSortOrder,
    genreSelections,
    handleGenreChange,
    clearGenres,
    genreOptions,
    filteredAlbums,
  } = useAlbumFilters(albums);

  const spotify = useSpotifyPlayer();

  return (
    <>
      <TopNav sortOrder={sortOrder} onSortOrderChange={setSortOrder} />
      <AlbumSpotlight album={selectedAlbum} spotify={spotify} onClose={() => setSelectedAlbum(null)} />
      <main>
        {isLargeScreen && (
          <TierFilter tierGroup={tierGroup} setTierGroup={setTierGroup} />
        )}
        <AlbumList albums={filteredAlbums} selectedAlbum={selectedAlbum} onSelectAlbum={setSelectedAlbum} />
        <Filters
          tierGroup={tierGroup}
          onTierChange={setTierGroup}
          genres={genreOptions}
          selectedGenres={genreSelections}
          onGenreChange={handleGenreChange}
          onClearGenres={clearGenres}
        />
      </main>
    </>
  )
}

export default App
