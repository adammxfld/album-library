import AlbumList from './components/AlbumList.js'
import { albums } from "./albums_data.ts";

function App() {
  return (
      <section id="center">
        <AlbumList albums={albums} />
      </section>
  )
}

export default App
