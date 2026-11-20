import { mkdir, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const inputDirectory = process.argv[2];
if (!inputDirectory) {
  throw new Error("Usage: node scripts/prepare-exhibition-archive.mjs <2026 photo directory>");
}

const assetDirectory = new URL("../public/assets/archive-2026/", import.meta.url);
const manifestPath = new URL("../src/data/exhibition-archive.json", import.meta.url);
const photos = (await readdir(inputDirectory)).flatMap(filename => {
  const id = filename.match(/-(\d{3})\.png$/i)?.[1];
  return id ? [{ id, filename }] : [];
}).sort((a, b) => a.id.localeCompare(b.id));

if (!photos.length || new Set(photos.map(photo => photo.id)).size !== photos.length) {
  throw new Error("Expected PNG photos with unique three-digit filename suffixes.");
}

await mkdir(assetDirectory, { recursive: true });
const manifest = [];
let nextIndex = 0;

async function preparePhotos() {
  for (let index = nextIndex++; index < photos.length; index = nextIndex++) {
    const { id, filename } = photos[index];
    const source = sharp(join(inputDirectory, filename)).autoOrient().toColourspace("srgb");

    for (const [width, quality] of [[480, 84], [800, 86], [1280, 88]]) {
      await source.clone().resize({ width, withoutEnlargement: true })
        .webp({ quality, effort: 5 }).toFile(fileURLToPath(new URL(`${id}-${width}.webp`, assetDirectory)));
    }

    const { width, height } = await source.webp({ quality: 94, effort: 5 })
      .toFile(fileURLToPath(new URL(`${id}-full.webp`, assetDirectory)));
    manifest[index] = { id, width, height };
  }
}

await Promise.all(Array.from({ length: 4 }, preparePhotos));
await writeFile(manifestPath, `[\n  ${manifest.map(photo => JSON.stringify(photo)).join(",\n  ")}\n]\n`);
console.log(`Prepared ${manifest.length} exhibition photos.`);
