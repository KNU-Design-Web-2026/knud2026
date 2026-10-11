import { readdir, mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// Generate web copies only; never modify the designers' source directory.
const [sourceRoot, artist, slug] = process.argv.slice(2);
if (!sourceRoot || !artist || !/^[a-z-]+$/.test(slug ?? "")) {
  throw new Error("Usage: node scripts/import-work-assets.mjs <source root> <artist> <slug>");
}
const entries = await readdir(sourceRoot);
const folder = entries.find((name) => name.normalize("NFC").startsWith(`${artist}_`));
if (!folder) throw new Error(`Missing artist folder: ${artist}`);
async function collect(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collect(fullPath));
    else if (/\.png$/i.test(entry.name)) files.push(fullPath);
  }
  return files;
}
const files = await collect(path.join(sourceRoot, folder));
const outputRoot = path.resolve("public/assets/works", slug);
await mkdir(outputRoot, { recursive: true });
async function convert(source, basename, maxWidth) {
  if (!source) throw new Error(`Missing source: ${artist}/${basename}`);
  const original = await sharp(source).metadata();
  const target = path.join(outputRoot, `${basename}.webp`);
  const result = await sharp(source).rotate().resize({ width: maxWidth, withoutEnlargement: true })
    .toColourspace("srgb").webp({ quality: 90, effort: 6 }).toFile(target);
  return {
    src: `/assets/works/${slug}/${basename}.webp`,
    width: result.width, height: result.height,
    sourceFile: path.relative(sourceRoot, source).normalize("NFC"),
    originalWidth: original.width, originalHeight: original.height,
    originalBytes: (await stat(source)).size, bytes: result.size,
  };
}
const thumbnail = await convert(files.find((file) => /_work\.png$/i.test(file)), "thumbnail", 768);
const space = await convert(files.find((file) => /_SPACE\.png$/i.test(file)), "space", 1248);
const hero = await convert(files.find((file) => file.normalize("NFC").endsWith("_상세.png")), "hero", 1920);
const portfolioSources = files.filter((file) => /_\d{3}\.png$/.test(file))
  .sort((a, b) => a.localeCompare(b));
if (!portfolioSources.length) throw new Error(`Missing portfolio: ${artist}`);
const images = [];
for (const [index, source] of portfolioSources.entries()) {
  images.push(await convert(source, `portfolio-${String(index + 1).padStart(3, "0")}`, 1920));
}
const manifest = { artist, thumbnail, space, hero, images };
await writeFile(path.join(outputRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ artist, pages: images.length,
  originalBytes: [thumbnail, space, hero, ...images].reduce((sum, image) => sum + image.originalBytes, 0),
  bytes: [thumbnail, space, hero, ...images].reduce((sum, image) => sum + image.bytes, 0) }));
