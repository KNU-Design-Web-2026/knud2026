import sharp from "sharp";

// These masks only drive the hover fade; the visible maps remain vector SVGs.
// Rasterize from the same exports at high density to retain exact lettering
// alignment on high-DPR screens and exclude coloured map lines from the mask.
for (const [name, scale] of [["map-assigned-2026", 8], ["map-assigned-mobile-2026", 4]]) {
  const base = new URL(`../public/assets/figma/space/${name}`, import.meta.url);
  const { data, info } = await sharp(`${base.pathname}.svg`, { density: 72 * scale })
    .flatten({ background: "#fff" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const mask = Buffer.alloc(info.width * info.height);
  for (let index = 0; index < mask.length; index++) {
    const pixel = index * info.channels;
    const red = data[pixel];
    const green = data[pixel + 1];
    const blue = data[pixel + 2];
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    mask[index] = max - min <= 8
      ? Math.min(255, Math.round(((255 - max) / 238) * 255))
      : 0;
  }
  await sharp(mask, { raw: { width: info.width, height: info.height, channels: 1 } })
    .png()
    .toFile(`${base.pathname}-name-mask.png`);
}
