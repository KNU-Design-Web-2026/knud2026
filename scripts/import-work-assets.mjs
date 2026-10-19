import { readdir, mkdir, stat, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { createWorkImagePreview } from "./work-image-preview.mjs";

// Generate web copies only; never modify the designers' source directory.
const [sourceRoot, artist, slug] = process.argv.slice(2);
if (!sourceRoot || !artist || !/^[a-z-]+$/.test(slug ?? "")) {
  throw new Error("Usage: node scripts/import-work-assets.mjs <source root> <artist> <slug>");
}
const entries = await readdir(sourceRoot);
const normalizedArtist = artist.replace(/\s/g, "");
const folder = entries.find((name) => name.normalize("NFC").replace(/\s/g, "").startsWith(`${normalizedArtist}_`));
if (!folder) throw new Error(`Missing artist folder: ${artist}`);
async function collect(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collect(fullPath));
    else if (/\.(png|gif)$/i.test(entry.name)) files.push(fullPath);
  }
  return files;
}
const files = await collect(path.join(sourceRoot, folder));
const outputRoot = path.resolve("public/assets/works", slug);
await mkdir(outputRoot, { recursive: true });
async function convert(source, basename, maxWidth) {
  if (!source) throw new Error(`Missing source: ${artist}/${basename}`);
  const original = await sharp(source).metadata();
  const originalBytes = (await stat(source)).size;
  if (original.format === "gif") {
    // Do not flatten or recompress the designer's animation into a still image.
    const filename = `${basename}.gif`;
    await copyFile(source, path.join(outputRoot, filename));
    const posterName = `${basename}-poster.webp`;
    await sharp(source).resize({ width: maxWidth, withoutEnlargement: true })
      .toColourspace("srgb").webp({ quality: 95, effort: 6 }).toFile(path.join(outputRoot, posterName));
    return {
      src: `/assets/works/${slug}/${filename}`,
      stillSrc: `/assets/works/${slug}/${posterName}`,
      animated: true,
      blurDataURL: await createWorkImagePreview(source),
      width: original.width, height: original.height,
      sourceFile: path.relative(sourceRoot, source).normalize("NFC"),
      originalWidth: original.width, originalHeight: original.height,
      originalBytes, bytes: originalBytes,
    };
  }
  const target = path.join(outputRoot, `${basename}.webp`);
  const result = await sharp(source).rotate().resize({ width: maxWidth, withoutEnlargement: true })
    .toColourspace("srgb").webp({ quality: basename === "space" ? 90 : 95, effort: 6 }).toFile(target);
  return {
    src: `/assets/works/${slug}/${basename}.webp`,
    blurDataURL: await createWorkImagePreview(source),
    width: result.width, height: result.height,
    sourceFile: path.relative(sourceRoot, source).normalize("NFC"),
    originalWidth: original.width, originalHeight: original.height,
    originalBytes, bytes: result.size,
  };
}
function selectSource(pattern) {
  const matches = files.filter(file => pattern.test(path.basename(file).normalize("NFC")));
  if (matches.length !== 1) throw new Error(`Expected one source for ${artist}/${pattern}, got ${matches.length}`);
  return matches[0];
}
// 이나경's numbered thumbnail pack was checked by dimensions:
// 01 = 8001px hero, 02 = 2601px SPACE, 03 = 1601px Work.
const numberedPack = artist === "이나경";
const thumbnailSource = selectSource(numberedPack ? /\(work,space,상세페이지\)-03\.png$/i : /(?:_work|^work_썸네일(?:_\d+x\d+)?)\.png$/i);
const spaceSource = selectSource(numberedPack ? /\(work,space,상세페이지\)-02\.png$/i : /(?:_space|^space_썸네일(?:_\d+x\d+)?)\.png$/i);
const heroSource = selectSource(numberedPack ? /\(work,space,상세페이지\)-01\.png$/i : /(?:_상세|^상세페이지_썸네일(?:_\d+x\d+)?)\.png$/);
const portfolioSources = files.filter(file => {
  const relative = path.relative(path.join(sourceRoot, folder), file).normalize("NFC");
  return /(?:포[트토]폴리오|상세페이지)\//.test(relative) && /(?:^|[_\s-])\d+\.(png|gif)$/i.test(path.basename(file));
}).sort((a, b) => Number(a.match(/(\d+)\.(png|gif)$/i)[1]) - Number(b.match(/(\d+)\.(png|gif)$/i)[1]));
if (!portfolioSources.length) throw new Error(`Missing portfolio: ${artist}`);
const thumbnail = await convert(thumbnailSource, "thumbnail", 1536);
const space = await convert(spaceSource, "space", 1248);
const hero = await convert(heroSource, "hero", 3840);
const images = [];
for (const [index, source] of portfolioSources.entries()) {
  images.push(await convert(source, `portfolio-${String(index + 1).padStart(3, "0")}`, 3840));
}
const manifest = { artist, thumbnail, space, hero, images };
await writeFile(path.join(outputRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ artist, pages: images.length,
  originalBytes: [thumbnail, space, hero, ...images].reduce((sum, image) => sum + image.originalBytes, 0),
  bytes: [thumbnail, space, hero, ...images].reduce((sum, image) => sum + image.bytes, 0) }));
