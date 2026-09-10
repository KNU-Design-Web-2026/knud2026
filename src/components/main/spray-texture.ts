import { TEXTURE_HALF_SIZE } from "./spray-paint";
import type { PaintStamp } from "./spray-paint";

// Per-effect cache: at most 12 variants × 2 scatter modes × 5 palette colors.
// A stamp references a shared template, never its own large pixel buffer.
export function createSprayTextureCache() {
  const cache = new Map<PaintStamp["particles"], Map<string, HTMLCanvasElement>>();
  return (stamp: PaintStamp): HTMLCanvasElement => {
    let colors = cache.get(stamp.particles);
    if (!colors) { colors = new Map(); cache.set(stamp.particles, colors); }
    const existing = colors.get(stamp.color);
    if (existing) return existing;
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
      }
    }
    colors.set(stamp.color, texture);
    return texture;
  };
}
