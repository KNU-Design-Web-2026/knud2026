import { TEXTURE_HALF_SIZE, TEXTURE_RADIUS_X, TEXTURE_RADIUS_Y } from "./spray-paint";
import type { PaintStamp } from "./spray-paint";

// Per-effect cache: at most 12 variants × 2 scatter modes × 5 palette colors.
// A stamp references a shared template, never its own large pixel buffer.
export function createSprayTextureCache({ preferImageBitmap = true } = {}) {
  type Entry = { source: HTMLCanvasElement | ImageBitmap; canvas: HTMLCanvasElement };
  const cache = new Map<PaintStamp["particles"], Map<string, Entry>>();
  let disposed = false;
  const get = (stamp: PaintStamp): HTMLCanvasElement | ImageBitmap => {
    if (disposed) throw new Error("Spray texture cache has been disposed");
    let colors = cache.get(stamp.particles);
    if (!colors) { colors = new Map(); cache.set(stamp.particles, colors); }
    const existing = colors.get(stamp.color);
    if (existing) return existing.source;
    const texture = document.createElement("canvas");
    const resolution = 2;
    texture.width = texture.height = TEXTURE_HALF_SIZE * 2 * resolution;
    const context = texture.getContext("2d");
    if (context) {
      context.scale(resolution, resolution);
      context.translate(TEXTURE_HALF_SIZE, TEXTURE_HALF_SIZE);
      context.fillStyle = stamp.color;
      for (const particle of stamp.particles) {
        context.globalAlpha = particle.alpha;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();
        // Bake stronger core coverage once; keep the sparse outer dust intact.
        if (Math.hypot(particle.x / TEXTURE_RADIUS_X, particle.y / TEXTURE_RADIUS_Y) < 1) {
          context.beginPath();
          context.arc(particle.x + 0.45, particle.y - 0.35, particle.radius, 0, Math.PI * 2);
          context.fill();
        }
      }
    }
    const entry: Entry = { source: texture, canvas: texture };
    colors.set(stamp.color, entry);
    // Keep drawing immediately; promote each immutable texture only once.
    // Unsupported/failed conversions retain the original Canvas fallback.
    if (context && preferImageBitmap && typeof createImageBitmap === "function") {
      try {
        void createImageBitmap(texture).then((bitmap) => {
          if (disposed) {
            bitmap.close();
            return;
          }
          entry.source = bitmap;
          texture.width = texture.height = 0;
        }).catch(() => { /* Keep the Canvas source; do not retry each frame. */ });
      } catch { /* Some implementations may throw before returning a promise. */ }
    }
    return texture;
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    for (const colors of cache.values()) for (const entry of colors.values()) {
      if (entry.source !== entry.canvas) (entry.source as ImageBitmap).close();
      entry.canvas.width = entry.canvas.height = 0;
    }
    cache.clear();
  };
  return { get, dispose };
}
