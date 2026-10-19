import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createWorkImagePreview } from "./work-image-preview.mjs";

const root = path.resolve("public/assets/works");
let count = 0;
let bytes = 0;
for (const dir of await readdir(root)) {
  const manifestPath = path.join(root, dir, "manifest.json");
  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") continue;
    throw error;
  }
  for (const image of [manifest.thumbnail, manifest.space, manifest.hero, ...manifest.images]) {
    image.blurDataURL = await createWorkImagePreview(path.resolve(`public${image.src}`));
    count++;
    bytes += Buffer.byteLength(image.blurDataURL);
  }
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}
console.log(JSON.stringify({ count, dataURLBytes: bytes }));
