import { Vibrant } from "node-vibrant/node";
import { albums } from "../src/albums_data.js";

function toGrayscale(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Perceived luminance
  const gray = Math.round(
    0.299 * r +
    0.587 * g +
    0.114 * b
  );

  const value = gray.toString(16).padStart(2, "0");

  return `#${value}${value}${value}`;
}

function toSepia(hex: string, amount = 1): string {
  const gray = parseInt(hex.slice(1, 3), 16);

  const sepiaR = Math.min(255, gray * 1.07);
  const sepiaG = Math.min(255, gray * 0.95);
  const sepiaB = Math.min(255, gray * 0.78);

  const mix = (original: number, tinted: number) =>
    Math.round(original + (tinted - original) * amount);

  const r = mix(gray, sepiaR);
  const g = mix(gray, sepiaG);
  const b = mix(gray, sepiaB);

  return `#${[r, g, b]
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("")}`;
}

async function main() {
  for (const album of albums) {
    if (!album.image || album.image === "fpo") {
      console.log(`${album.artist} - ${album.title}: skipped`);
      continue;
    }

    try {
      const palette = await Vibrant.from(album.image).getPalette();

      const vibrant = palette.Vibrant?.hex;

      if (vibrant) {
        const gray = toGrayscale(vibrant);
        const sepia = toSepia(gray);

        console.log(
          `${album.artist} - ${album.title}: ${sepia}`
        );
      }
    } catch (error) {
      console.error(`${album.artist} - ${album.title}: failed`);
    }
  }
}

main();