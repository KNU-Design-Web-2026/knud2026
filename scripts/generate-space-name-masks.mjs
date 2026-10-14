import sharp from "sharp";

// Keep the raster lettering's exact placement, including angled names. Exclude
// coloured map lines so hovering a hit area cannot tint the surrounding map.
for (const name of ["map-assigned-2026", "map-assigned-mobile-2026"]) {
  const base = new URL(`../public/assets/figma/space/${name}`, import.meta.url);
  const { data, info } = await sharp(`${base.pathname}.png`)
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
