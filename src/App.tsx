import AlbumList from './components/AlbumList.js'
import AlbumSpotlight from './components/AlbumSpotlight.js'
import Filters from './components/Filters.tsx'
import { albums, type Album } from "./albums_data.ts";
import { useState } from 'react';
import { useAlbumFilters } from './hooks/useAlbumFilters.ts';

function App() {
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const {
    tierGroup,
    setTierGroup,
    genreSelections,
    handleGenreChange,
    genreOptions,
    filteredAlbums,
  } = useAlbumFilters(albums);

  return (
    <>
      <AlbumSpotlight album={selectedAlbum} onClose={() => setSelectedAlbum(null)} />
      <AlbumList albums={filteredAlbums} onSelectAlbum={setSelectedAlbum} />
      <Filters
        tierGroup={tierGroup}
        onTierChange={setTierGroup}
        genres={genreOptions}
        selectedGenres={genreSelections}
        onGenreChange={handleGenreChange}
      />
    </>
  )
}

export default App
