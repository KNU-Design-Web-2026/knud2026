import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "../..");
const outputDirectory = path.join(projectRoot, "public/performance-fixtures/archive-before");
const fixtureSeed = 20260926;
const portraitCount = 24;
const landscapeCount = 16;
const targetMinimumBytes = Math.round(1.5 * 1024 * 1024);
const targetMaximumBytes = Math.round(2.5 * 1024 * 1024);
const cropPositions = [
  "centre",
  "north",
  "south",
  "east",
  "west",
  "northeast",
  "northwest",
  "southeast",
  "southwest",
];

const sourceAssets = [
  "public/assets/figma/about/poster.png",
  "public/assets/figma/about/exhibition-map.png",
  "public/assets/figma/main-frame-1920.png",
  "public/assets/figma/message/message-decor-web.png",
  "public/assets/figma/space/project-preview.png",
  "public/assets/figma/work/work-detail-hero.png",
  "public/assets/figma/work/work-placeholder.png",
  "public/assets/og/knud-ignite-blue.png",
];

function createRandom(seed) {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

function createNoiseOverlay(seed, alpha) {
  const random = createRandom(seed);
  const width = 512;
  const height = 512;
  const channels = 4;
  const data = Buffer.alloc(width * height * channels);

  for (let index = 0; index < width * height; index += 1) {
    const value = Math.floor(random() * 256);
    const offset = index * channels;
    data[offset] = value;
    data[offset + 1] = Math.min(255, value + Math.floor(random() * 18));
    data[offset + 2] = Math.max(0, value - Math.floor(random() * 18));
    data[offset + 3] = alpha;
  }

  return sharp(data, { raw: { width, height, channels } }).png().toBuffer();
}

function createGraphicOverlay(width, height, seed) {
  const random = createRandom(seed);
  const colors = ["#12acec", "#ff1d22", "#ffda1a", "#ffffff", "#111111"];
  const shapes = Array.from({ length: 18 }, (_, index) => {
    const x = Math.round(random() * width);
    const y = Math.round(random() * height);
    const radius = Math.round((0.03 + random() * 0.12) * Math.min(width, height));
    const color = colors[(index + seed) % colors.length];
    const opacity = (0.06 + random() * 0.12).toFixed(2);

    return `<circle cx="${x}" cy="${y}" r="${radius}" fill="${color}" opacity="${opacity}" />`;
  }).join("");

  return Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="wash" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#12acec" stop-opacity="0.12" />
          <stop offset="0.55" stop-color="#ffffff" stop-opacity="0" />
          <stop offset="1" stop-color="#ff1d22" stop-opacity="0.1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#wash)" />
      ${shapes}
    </svg>
  `);
}

async function encodeWithinBudget(rawImage, width, height) {
  let lowerQuality = 45;
  let upperQuality = 96;
  let closest = null;
  const targetBytes = (targetMinimumBytes + targetMaximumBytes) / 2;

  for (let attempt = 0; attempt < 7; attempt += 1) {
    if (lowerQuality > upperQuality) {
      break;
    }

    const quality = Math.round((lowerQuality + upperQuality) / 2);
    const encoded = await sharp(rawImage, { raw: { width, height, channels: 3 } })
      .jpeg({ quality, mozjpeg: true, chromaSubsampling: "4:2:0" })
      .toBuffer();
    const distance = Math.abs(encoded.byteLength - targetBytes);

    if (!closest || distance < closest.distance) {
      closest = { buffer: encoded, distance, quality };
    }

    if (encoded.byteLength < targetMinimumBytes) {
      lowerQuality = quality + 1;
    } else if (encoded.byteLength > targetMaximumBytes) {
      upperQuality = quality - 1;
    } else {
      return { buffer: encoded, quality };
    }
  }

  return closest;
}

async function createFixture(index) {
  const isPortrait = index < portraitCount;
  const width = isPortrait ? 3000 : 4000;
  const height = isPortrait ? 4000 : 3000;
  const random = createRandom(fixtureSeed + index * 97);
  const sourcePath = path.join(projectRoot, sourceAssets[index % sourceAssets.length]);
  const graphicOverlay = createGraphicOverlay(width, height, fixtureSeed + index * 173);
  const modulation = {
    brightness: 0.9 + random() * 0.2,
    saturation: 0.85 + random() * 0.35,
    hue: Math.round(random() * 24 - 12),
  };
  let encodedFixture = null;
  let usedNoiseAlpha = 136;

  for (const noiseAlpha of [136, 196, 232]) {
    const noiseOverlay = await createNoiseOverlay(fixtureSeed + index * 131, noiseAlpha);
    const rawImage = await sharp(sourcePath)
      .rotate()
      .resize(width, height, {
        fit: "cover",
        position: cropPositions[index % cropPositions.length],
      })
      .modulate(modulation)
      .composite([
        { input: graphicOverlay, blend: "soft-light" },
        { input: noiseOverlay, tile: true, blend: "overlay" },
      ])
      .removeAlpha()
      .raw()
      .toBuffer();

    encodedFixture = await encodeWithinBudget(rawImage, width, height);
    usedNoiseAlpha = noiseAlpha;

    if (encodedFixture.buffer.byteLength >= targetMinimumBytes) {
      break;
    }
  }

  const { buffer, quality } = encodedFixture;
  const id = String(index + 1).padStart(2, "0");
  const fileName = `archive-before-${id}.jpg`;
  const outputPath = path.join(outputDirectory, fileName);

  await writeFile(outputPath, buffer);

  return {
    id: `before-${id}`,
    src: `/performance-fixtures/archive-before/${fileName}`,
    width,
    height,
    bytes: buffer.byteLength,
    quality,
    noiseAlpha: usedNoiseAlpha,
    source: sourceAssets[index % sourceAssets.length],
  };
}

async function main() {
  await rm(outputDirectory, { recursive: true, force: true });
  await mkdir(outputDirectory, { recursive: true });

  const fixtures = [];
  const totalCount = portraitCount + landscapeCount;

  for (let index = 0; index < totalCount; index += 1) {
    const fixture = await createFixture(index);
    fixtures.push(fixture);
    process.stdout.write(
      `[${String(index + 1).padStart(2, "0")}/${totalCount}] ${path.basename(fixture.src)} ${(
        fixture.bytes /
        1024 /
        1024
      ).toFixed(2)} MiB q${fixture.quality}\n`,
    );
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    seed: fixtureSeed,
    targetBytes: {
      minimum: targetMinimumBytes,
      maximum: targetMaximumBytes,
    },
    totalBytes: fixtures.reduce((sum, fixture) => sum + fixture.bytes, 0),
    images: fixtures,
  };

  await writeFile(path.join(outputDirectory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  const directoryStats = await stat(outputDirectory);

  if (!directoryStats.isDirectory()) {
    throw new Error("Archive fixture output was not created as a directory.");
  }

  process.stdout.write(
    `Generated ${fixtures.length} fixtures, ${(manifest.totalBytes / 1024 / 1024).toFixed(2)} MiB total.\n`,
  );
}

await main();
