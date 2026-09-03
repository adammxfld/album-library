import AlbumList from './components/AlbumList.js'
import { albums } from "./albums_data.ts";
import { useState } from 'react';
import TierFilter from './components/TierFilter.tsx';

function App() {
  const [tier, setTier] = useState(1);
  const filteredAlbums = tier === 0 ? albums : albums.filter((a) => a.tier === tier)

  return (
      <section id="center">
        <TierFilter setTier={setTier} />
        <AlbumList albums={filteredAlbums} />
      </section>
  )
}

export default App
