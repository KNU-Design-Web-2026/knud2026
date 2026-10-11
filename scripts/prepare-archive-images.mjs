import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const count = 40;
const originalBase = "https://design-graduation-image.s3.ap-northeast-2.amazonaws.com/archive";
const assetDirectory = fileURLToPath(new URL("../public/assets/archive/", import.meta.url));
const manifestPath = new URL("../src/data/archive-web-images.json", import.meta.url);
const manifest = Array(count);
await mkdir(assetDirectory, { recursive: true });

async function prepare(index) {
  const originalSrc = `${originalBase}/${index + 1}.webp`;
  let buffer;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(originalSrc, { signal: AbortSignal.timeout(60000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      buffer = Buffer.from(await response.arrayBuffer());
      break;
    } catch (error) {
      if (attempt === 2) throw error;
    }
  }
  const metadata = await sharp(buffer).metadata();
  const src = `/assets/archive/${String(index + 1).padStart(2, "0")}.webp`;
  const { data, info } = await sharp(buffer).rotate().resize({ width: 1600, withoutEnlargement: true })
    .toColourspace("srgb").webp({ quality: 85 }).toBuffer({ resolveWithObject: true });
  await writeFile(`${assetDirectory}${String(index + 1).padStart(2, "0")}.webp`, data);
  manifest[index] = { originalSrc, originalWidth: metadata.width, originalHeight: metadata.height,
    originalBytes: buffer.length, src, width: info.width, height: info.height, bytes: data.length };
  console.log(`${index + 1}/${count}: ${buffer.length} -> ${data.length} bytes`);
}

// Two workers avoid saturating the upstream connection with forty large originals.
let nextIndex = 0;
await Promise.all(Array.from({ length: 2 }, async () => {
  while (nextIndex < count) await prepare(nextIndex++);
}));
// Publish metadata only after every image succeeds; a partial run is not deployable.
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Total: ${manifest.reduce((sum, item) => sum + item.originalBytes, 0)} -> ${manifest.reduce((sum, item) => sum + item.bytes, 0)} bytes`);
