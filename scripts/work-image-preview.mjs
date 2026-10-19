import sharp from "sharp";

const MAX_PREVIEW_WIDTH = 256;
const MAX_PREVIEW_BYTES = 4096;

export async function createWorkImagePreview(source) {
  // Keep silhouettes and composition recognizable without inflating inline HTML.
  // Re-encode from the source on each attempt, not an already compressed preview.
  for (let width = MAX_PREVIEW_WIDTH; ; width = Math.max(1, Math.floor(width * 0.75))) {
    const preview = await sharp(source).rotate()
      .resize({ width, height: width * 2, fit: "inside", withoutEnlargement: true })
      .toColourspace("srgb").webp({ quality: 60, effort: 4 }).toBuffer();
    if (preview.length <= MAX_PREVIEW_BYTES) {
      return `data:image/webp;base64,${preview.toString("base64")}`;
    }
  }
}
