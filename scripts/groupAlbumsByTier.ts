import fs from "node:fs";
import path from "node:path";

const filePath = path.resolve("src/albums_data.ts");

const file = fs.readFileSync(filePath, "utf8");

// Extract everything inside:
// export const albums = [ ... ];
const match = file.match(
  /export const albums\s*=\s*\[([\s\S]*)\];\s*$/
);

if (!match) {
  throw new Error("Could not find albums array.");
}

const contents = match[1];

// Match each album object
const albumMatches = contents.match(/\{\s*artist:[\s\S]*?\n\s*\},/g);

if (!albumMatches) {
  throw new Error("No albums found.");
}

const tiers: Record<number, string[]> = {};

for (const album of albumMatches) {
  const tierMatch = album.match(/tier:\s*(\d+),/);

  if (!tierMatch) {
    throw new Error(`Album missing tier:\n${album}`);
  }

  const tier = Number(tierMatch[1]);

  // Remove tier from the individual album
  const cleanedAlbum = album.replace(
    /^\s*tier:\s*\d+,\s*\n/m,
    ""
  );

  if (!tiers[tier]) {
    tiers[tier] = [];
  }

  tiers[tier].push(cleanedAlbum);
}

const tierGroups = Object.entries(tiers)
  .sort(([a], [b]) => Number(a) - Number(b))
  .map(([tier, tierAlbums]) => {
    const albums = tierAlbums
      .map((album) =>
        album
          .split("\n")
          .map((line) => `    ${line}`)
          .join("\n")
      )
      .join("\n");

    return `  {
    tier: ${tier},
    albums: [
${albums}
    ],
  },`;
  })
  .join("\n");

const output = `export const albums = [
${tierGroups}
];
`;

fs.writeFileSync(filePath, output);

console.log("Grouped albums by tier.");