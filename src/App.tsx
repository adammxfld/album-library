import AlbumList from './components/AlbumList.js'
import { albums } from "./albums_data.ts";

function App() {
  const tierOneAlbums = albums.filter((album) => album.tier === 1)

  return (
      <section id="center">
        <AlbumList albums={tierOneAlbums} />
      </section>
  )
}

export default App
