import sharp from "sharp";

export async function createWorkImagePreview(source) {
  const preview = await sharp(source).rotate()
    .resize({ width: 16, height: 16, fit: "inside", withoutEnlargement: true })
    .toColourspace("srgb").webp({ quality: 40, effort: 4 }).toBuffer();
  return `data:image/webp;base64,${preview.toString("base64")}`;
}
