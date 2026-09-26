import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "../..");
const beforeDirectory = path.join(projectRoot, "public/performance-fixtures/archive-before");
const outputDirectory = path.join(projectRoot, "public/performance-fixtures/archive-after");
const widths = [480, 768, 1080, 1600];
const formats = [
  { extension: "avif", quality: 60 },
  { extension: "webp", quality: 75 },
];

function publicPath(fileName) {
  return `/performance-fixtures/archive-after/${fileName}`;
}

async function encodeVariant(inputPath, id, width, format) {
  const fileName = `${id}-${width}.${format.extension}`;
  const outputPath = path.join(outputDirectory, fileName);
  const image = sharp(inputPath).rotate().resize({ width, withoutEnlargement: true });

  if (format.extension === "avif") {
    await image.avif({ quality: format.quality, effort: 3 }).toFile(outputPath);
  } else {
    await image.webp({ quality: format.quality, effort: 4 }).toFile(outputPath);
  }

  const fileStats = await stat(outputPath);

  return {
    width,
    src: publicPath(fileName),
    bytes: fileStats.size,
  };
}

async function createBlurDataUrl(inputPath) {
  const buffer = await sharp(inputPath)
    .rotate()
    .resize({ width: 24, withoutEnlargement: true })
    .jpeg({ quality: 45, mozjpeg: true })
    .toBuffer();

  return `data:image/jpeg;base64,${buffer.toString("base64")}`;
}

async function createOptimizedFixture(image, index, totalCount) {
  const inputPath = path.join(projectRoot, "public", image.src.replace(/^\//, ""));
  const id = `archive-after-${String(index + 1).padStart(2, "0")}`;
  const sources = {};

  for (const format of formats) {
    sources[format.extension] = [];

    for (const width of widths) {
      sources[format.extension].push(await encodeVariant(inputPath, id, width, format));
    }
  }

  const optimizedBytes = Object.values(sources)
    .flat()
    .reduce((sum, candidate) => sum + candidate.bytes, 0);

  process.stdout.write(
    `[${String(index + 1).padStart(2, "0")}/${totalCount}] ${id} ${(optimizedBytes / 1024).toFixed(0)} KiB\n`,
  );

  return {
    id,
    width: image.width,
    height: image.height,
    aspectRatio: image.width / image.height,
    blurDataURL: await createBlurDataUrl(inputPath),
    sources,
  };
}

async function main() {
  const beforeManifestPath = path.join(beforeDirectory, "manifest.json");
  const beforeManifest = JSON.parse(await readFile(beforeManifestPath, "utf8"));

  await rm(outputDirectory, { recursive: true, force: true });
  await mkdir(outputDirectory, { recursive: true });

  const images = [];

  for (let index = 0; index < beforeManifest.images.length; index += 1) {
    images.push(await createOptimizedFixture(beforeManifest.images[index], index, beforeManifest.images.length));
  }

  const totalsByFormat = Object.fromEntries(
    formats.map(format => [
      format.extension,
      images.flatMap(image => image.sources[format.extension]).reduce((sum, candidate) => sum + candidate.bytes, 0),
    ]),
  );
  const manifest = {
    generatedAt: new Date().toISOString(),
    sourceManifest: "/performance-fixtures/archive-before/manifest.json",
    widths,
    formats: Object.fromEntries(formats.map(format => [format.extension, { quality: format.quality }])),
    totalsByFormat,
    images,
  };

  await writeFile(path.join(outputDirectory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  process.stdout.write(
    `Generated ${images.length} responsive image sets. AVIF ${(totalsByFormat.avif / 1024 / 1024).toFixed(2)} MiB, WebP ${(totalsByFormat.webp / 1024 / 1024).toFixed(2)} MiB.\n`,
  );
}

await main();
