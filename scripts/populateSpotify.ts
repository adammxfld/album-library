import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

const filePath = path.resolve("src/albums_data.ts");

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  throw new Error("Missing Spotify credentials in .env");
}

// Get Spotify access token.
async function getToken(): Promise<string> {
  const credentials = Buffer.from(
    `${clientId}:${clientSecret}`
  ).toString("base64");

  const response = await fetch(
    "https://accounts.spotify.com/api/token",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    }
  );

  const data = await response.json();

  if (!response.ok || !data.access_token) {
    throw new Error("Spotify did not return a valid access token.");
  }

  return data.access_token;
}

// Search Spotify for the album.
async function getSpotifyAlbum(
  token: string,
  artist: string,
  title: string
) {
  const query = encodeURIComponent(`${artist} ${title}`);

  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${query}&type=album&limit=1&market=US`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error(`Spotify album search failed: ${artist} - ${title}`);
    return null;
  }

  return data.albums?.items?.[0] ?? null;
}

// Get Spotify artist metadata for genres.
async function getSpotifyArtist(
  token: string,
  artistId: string
) {
  const response = await fetch(
    `https://api.spotify.com/v1/artists/${artistId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    return null;
  }

  return data;
}

async function main() {
  const token = await getToken();

  let file = fs.readFileSync(filePath, "utf8");

  // Find each album object and capture artist + title.
  const albumRegex =
    /\{\s*artist:\s*"([^"]+)"[\s\S]*?title:\s*"([^"]+)"[\s\S]*?\n\s*\},/g;

  const matches = [...file.matchAll(albumRegex)];

  console.log(`Found ${matches.length} albums.`);

  for (const match of matches) {
    const artist = match[1];
    const title = match[2];

    if (!artist || !title) {
      console.error("Album is missing artist or title.");
      continue;
    }

    let albumObject = match[0];

    // Determine which properties need to be populated.
    const needsSpotifyGenre =
      !/spotifyGenre:\s*/.test(albumObject) ||
      /spotifyGenre:\s*null/.test(albumObject);

    const needsSpotifyUrl =
      !/spotifyUrl:\s*/.test(albumObject) ||
      /spotifyUrl:\s*null/.test(albumObject);

    const needsImage =
      !/image:\s*/.test(albumObject) ||
      /image:\s*null/.test(albumObject);

    // Skip Spotify entirely if this album already has everything.
    if (!needsSpotifyGenre && !needsSpotifyUrl && !needsImage) {
      console.log(`Skipping: ${artist} - ${title}`);
      continue;
    }

    console.log(`Searching: ${artist} - ${title}`);

    const spotifyAlbum = await getSpotifyAlbum(
      token,
      artist,
      title
    );

    if (!spotifyAlbum) {
      console.error(`No Spotify album found: ${artist} - ${title}`);
      continue;
    }

    // Populate spotifyUrl if needed.
    if (needsSpotifyUrl) {
      const spotifyUrl =
        spotifyAlbum.external_urls?.spotify;

      if (spotifyUrl) {
        if (/spotifyUrl:\s*null/.test(albumObject)) {
          albumObject = albumObject.replace(
            /spotifyUrl:\s*null/,
            `spotifyUrl: "${spotifyUrl}"`
          );
        } else {
          albumObject = albumObject.replace(
            /\n\s*\},$/,
            `\n    spotifyUrl: "${spotifyUrl}",\n  },`
          );
        }

        console.log("  Added spotifyUrl");
      }
    }

    // Populate image if needed.
    if (needsImage) {
      const image =
        spotifyAlbum.images?.[0]?.url;

      if (image) {
        if (/image:\s*null/.test(albumObject)) {
          albumObject = albumObject.replace(
            /image:\s*null/,
            `image: "${image}"`
          );
        } else {
          albumObject = albumObject.replace(
            /\n\s*\},$/,
            `\n    image: "${image}",\n  },`
          );
        }

        console.log("  Added image");
      }
    }

    // Populate spotifyGenre if needed.
    if (needsSpotifyGenre) {
      const artistId =
        spotifyAlbum.artists?.[0]?.id;

      if (!artistId) {
        console.error(`No Spotify artist ID found: ${artist}`);
      } else {
        const spotifyArtist =
          await getSpotifyArtist(token, artistId);

        if (!spotifyArtist) {
          console.error(`No Spotify artist data found: ${artist}`);
        } else {
          const spotifyGenres =
            spotifyArtist.genres ?? [];

          if (/spotifyGenre:\s*null/.test(albumObject)) {
            albumObject = albumObject.replace(
              /spotifyGenre:\s*null/,
              `spotifyGenre: ${JSON.stringify(spotifyGenres)}`
            );
          } else {
            albumObject = albumObject.replace(
              /\n\s*\},$/,
              `\n    spotifyGenre: ${JSON.stringify(spotifyGenres)},\n  },`
            );
          }

          console.log(
            `  Added spotifyGenre: ${
              spotifyGenres.join(", ") || "none"
            }`
          );
        }
      }
    }

    // Replace the original album object with the updated version.
    file = file.replace(match[0], albumObject);
  }

  fs.writeFileSync(filePath, file);

  console.log("Done. albums_data.ts updated.");
}

main();