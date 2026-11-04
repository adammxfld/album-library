import AlbumList from './components/AlbumList.js'
import AlbumSpotlight from './components/AlbumSpotlight.js'
import Filters from './components/Filters.tsx'
import TopNav from './components/TopNav.tsx'
import { albums, type Album } from "./albums_data.ts";
import { useState } from 'react';
import { useAlbumFilters, type TierGroup } from './hooks/useAlbumFilters.ts';
import TierFilter from './components/TierFilter.tsx';
import { useMediaQuery } from './hooks/useMediaQuery.ts';
import { useSpotifyPlayer } from './hooks/useSpotifyPlayer.ts';
import { useGuestPicks } from './guestPicks/useGuestPicks.ts';
import GuestPicks from './guestPicks/GuestPicks.tsx';
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
  const isGuestPicks = tierGroup === "guest-picks";
  const guestPicks = useGuestPicks(isGuestPicks);

  function handleTierChange(tier: TierGroup) {
    if (tier === "guest-picks") {
      // Entering Guest Picks starts grouped by guest, with no Spotlight.
      guestPicks.resetSortOrder();
      setSelectedAlbum(null);
    }
    setTierGroup(tier);
  }

  return (
    <>
      <TopNav
        sortOrder={isGuestPicks ? guestPicks.sortOrder : sortOrder}
        onSortOrderChange={isGuestPicks ? guestPicks.toggleSortOrder : setSortOrder}
      />
      <AlbumSpotlight album={selectedAlbum} spotify={spotify} onClose={() => setSelectedAlbum(null)} />
      <main>
        {isLargeScreen && (
          <TierFilter tierGroup={tierGroup} setTierGroup={handleTierChange} />
        )}
        {isGuestPicks ? (
          <AlbumList                           
            albums={guestPicks.entries}
            isLoading={guestPicks.isLoading}
            header={<GuestPicks />}
          />  
        ) : (
          <AlbumList albums={filteredAlbums} selectedAlbum={selectedAlbum} onSelectAlbum={setSelectedAlbum} />
        )}
        <Filters
          tierGroup={tierGroup}
          onTierChange={handleTierChange}
          genres={genreOptions}
          selectedGenres={genreSelections}
          onGenreChange={handleGenreChange}
          onClearGenres={clearGenres}
          genresDisabled={isGuestPicks}
        />
      </main>
    </>
  )
}

export default App
