import AlbumList from './components/AlbumList.js'
import AlbumSpotlight from './components/AlbumSpotlight.js'
import { albums, type Album } from "./albums_data.ts";
import { useState } from 'react';
import TierFilter from './components/TierFilter.tsx';
import GenreFilter from './components/GenreFilter.tsx';

function App() {
  const [tierGroup, setTierGroup] = useState(1);
  const [genreSelections, setGenreSelections] = useState<string[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);

  function handleGenreChange(genre: string, checked: boolean) {
    setGenreSelections((currentGenres) => {
      if (checked) {
        return [...currentGenres, genre];
      }
      return currentGenres.filter((item) => item !== genre);
    });
  }

  const filteredAlbums = albums.filter((a) => {
    const matchesTier = tierGroup === 0 || a.tier === tierGroup;
    const matchesGenres = 
      genreSelections.length === 0 
      || a.genres.some((genre) => genreSelections.includes(genre));

    return matchesTier && matchesGenres;
    });

  return (
      <section>
        <TierFilter setTierGroup={setTierGroup} />
        <GenreFilter onGenreChange={handleGenreChange}/>
        <AlbumSpotlight album={selectedAlbum} onClose={() => setSelectedAlbum(null)} />
        <AlbumList albums={filteredAlbums} onSelectAlbum={setSelectedAlbum} />
      </section>
  )
}

export default App
