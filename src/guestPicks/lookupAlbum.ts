// Looks up a guest pick with the iTunes Search API, which needs no key and can
// be called from the browser. A match supplies album art and Apple's spelling
// of the artist and title. Everything is optional: any failure, timeout, or
// weak match returns null and the pick is saved as typed, without art.
const SEARCH_URL = "https://itunes.apple.com/search";
const LOOKUP_URL = "https://itunes.apple.com/lookup";
const TIMEOUT_MS = 4000;
const MAX_ARTISTS = 3; // same-named artists checked by the artist fallback

// Album and song results both carry the album's name and cover.
type ItunesResult = { artistName: string; collectionName?: string; artworkUrl100?: string };
type ItunesArtist = { artistId: number; artistName: string };

export interface AlbumMatch {
  artist: string;
  title: string;
  imageSmall: string | null;
}

// Lowercase, strip accents and punctuation: "Beyoncé" → "beyonce".
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Same words, ignoring case, accents and punctuation.
function same(a: string, b: string): boolean {
  return normalize(a) !== "" && normalize(a) === normalize(b);
}

// Either contains the other, so "Beatles" matches "The Beatles" and
// "3 Feet High and Rising" matches "3 Feet High and Rising (Deluxe)".
function loosely(a: string, b: string): boolean {
  const x = normalize(a);
  const y = normalize(b);
  return x !== "" && y !== "" && (x.includes(y) || y.includes(x));
}

// Of the loose matches, prefer an exact title, then an exact artist, so
// "R.A.P. Music" picks that album over "R.A.P. Music (Instrumentals)".
function bestMatch(results: ItunesResult[], artist: string, title: string): ItunesResult | undefined {
  let best: ItunesResult | undefined;
  let bestScore = -1;
  for (const result of results) {
    const album = result.collectionName ?? "";
    if (!loosely(result.artistName, artist) || !loosely(album, title)) continue;
    const score = (same(album, title) ? 2 : 0) + (same(result.artistName, artist) ? 1 : 0);
    if (score > bestScore) {
      best = result;
      bestScore = score;
    }
  }
  return best;
}

// Apple's spelling of what the guest typed, without adding anything:
// "vince staples" → "Vince Staples", "Beyonce" → "Beyoncé", and "Billy Woods"
// → "billy woods" (not "billy woods & Kenny Segal"). Otherwise the typed text.
function applesSpelling(typed: string, apple: string): string {
  const text = typed.trim();
  if (same(text, apple)) return apple;
  const start = apple.toLowerCase().indexOf(text.toLowerCase());
  const span = start === -1 ? "" : apple.slice(start, start + text.length);
  return span.toLowerCase() === text.toLowerCase() ? span : typed;
}

// One Search or Lookup API call. Any failure or timeout gives no results.
async function fetchResults<T>(url: string, params: Record<string, string>): Promise<T[]> {
  try {
    const response = await fetch(`${url}?${new URLSearchParams(params)}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!response.ok) return [];
    return ((await response.json()) as { results: T[] }).results;
  } catch {
    return [];
  }
}

// The best match among results, with Apple's spelling applied, or null.
function toMatch(results: ItunesResult[], artist: string, title: string): AlbumMatch | null {
  const match = bestMatch(results, artist, title);
  if (!match) return null;
  return {
    artist: applesSpelling(artist, match.artistName),
    title: applesSpelling(title, match.collectionName ?? ""),
    imageSmall: match.artworkUrl100 ?? null, // 100px, like the library's imageSmall
  };
}

// Searches one kind of result for "artist title".
async function search(entity: "album" | "song", artist: string, title: string): Promise<AlbumMatch | null> {
  const results = await fetchResults<ItunesResult>(SEARCH_URL, { term: `${artist} ${title}`, entity, limit: "25" });
  return toMatch(results, artist, title);
}

// Finds artists with exactly this name and checks their album lists. Catches
// albums buried in search, like self-titled ones (Peeping Tom / Peeping Tom).
async function searchByArtist(artist: string, title: string): Promise<AlbumMatch | null> {
  const artists = await fetchResults<ItunesArtist>(SEARCH_URL, { term: artist, entity: "musicArtist", limit: "10" });
  const ids = artists.filter((a) => same(a.artistName, artist)).slice(0, MAX_ARTISTS).map((a) => a.artistId);
  if (ids.length === 0) return null;
  // One Lookup call takes several artist ids.
  const albums = await fetchResults<ItunesResult>(LOOKUP_URL, { id: ids.join(","), entity: "album", limit: "200" });
  return toMatch(albums, artist, title);
}

// Album search first. Some albums only show up in song search (Broken Social
// Scene's You Forgot It in People), and some only through the artist's album
// list, so each fallback runs only when the step before it finds nothing.
export async function lookupAlbum(artist: string, title: string): Promise<AlbumMatch | null> {
  return (
    (await search("album", artist, title)) ??
    (await search("song", artist, title)) ??
    (await searchByArtist(artist, title))
  );
}
