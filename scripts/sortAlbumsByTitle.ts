import { error } from "node:console";
import fs from "node:fs";
import path from "node:path";

const filePath = path.resolve("src/albums_data.ts");

let file = fs.readFileSync(filePath, "utf8");

// Find top level albums array.
const arrayRegex = /(export const albums\s*=\s*\[)([\s\S]*?)(\n\];)/g;

const match = file.match(arrayRegex);

if (!match) {
  console.error("!!! No `albums` array exists !!!")
  process.exit(1);
}

const albumObjects = file.match(/\{[\s\S]*?\},/g) ?? [];

if (!albumObjects) {
  console.error("!!! No album objects exist !!!")
  process.exit(1);
}

const albumWithoutTitle = albumObjects.find(
  (albumObject: string) => !/title:\s*"/.test(albumObject)
)

if (albumWithoutTitle) {
  const artist = albumWithoutTitle.match(/artist:\s*"([^"]+)"/)?.[1] ?? "Unknown";
  console.error(`!!! ${artist} is missing an album title !!!`);
  console.error(albumWithoutTitle);
  process.exit(1);
}


file = file.replace(
  arrayRegex,
  (_fullMatch, start, albumsContent, end) => {
    // Find the individual album objects.
    const albumMatches =
      albumsContent.match(/\{\s*artist:[\s\S]*?\n\s*\},/g);
    
    if (!albumMatches) {
      console.error("!!! No album matches exist !!!")
      process.exit(1);
    }

    const beforeSort = [...albumMatches];

    try {
      // Overlook leading articles "the" or "a"
      const getSortTitle = (title: string) => {
        return title.replace(/^(the|a)\s+/i, "");
      };

      // Sort alphabetically by album title.
      albumMatches.sort((a: string, b: string) => {
        const titleA = a.match(/title:\s*"([^"]+)"/)?.[1] ?? "";
        const titleB = b.match(/title:\s*"([^"]+)"/)?.[1] ?? "";

        return  getSortTitle(titleA).localeCompare(
          getSortTitle(titleB), "en", {
            sensitivity: "base",
          }
        );
      });

      // Check whether the order actually changed.
      const orderChanged = albumMatches.some(
        (album: string, index: number) => album !== beforeSort[index]
      );

      if (orderChanged) {
        console.log("Album reordering successful. Hooray!")
      } else {
        console.error("Album reordering UN-successful. Booooo.")
      }


    } catch (error) {
      console.error("Sort failed:", error)
    }

    

    return `${start}\n${albumMatches.join("\n")}${end}`;
  }
);

fs.writeFileSync(filePath, file);