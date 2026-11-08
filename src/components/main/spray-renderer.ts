import { getDripProgress, getPaintOpacity, TEXTURE_HALF_SIZE, TEXTURE_RADIUS_X, TEXTURE_RADIUS_Y } from "./spray-paint";
import type { PaintStamp } from "./spray-paint";
import type { createSprayTextureCache } from "./spray-texture";
import { createStampGroups } from "./spray-stamp-groups";
import { createSprayDirtyTiles, type SprayBounds as Bounds } from "./spray-dirty-tiles";

type Textures = ReturnType<typeof createSprayTextureCache>;
type Surface = { canvas: HTMLCanvasElement; x: number; y: number; bytes: number };
type Snapshot = { bounds: Bounds; opacity: number; dripProgress: number };
const MAX_SURFACE_DIMENSION = 4096;

function stampBounds(stamp: PaintStamp, now: number): Bounds {
  const cosine = Math.abs(Math.cos(stamp.direction)), sine = Math.abs(Math.sin(stamp.direction));
  const x = TEXTURE_HALF_SIZE * stamp.bodyWidth / TEXTURE_RADIUS_X;
  const y = TEXTURE_HALF_SIZE * stamp.bodyHeight / TEXTURE_RADIUS_Y;
  const rx = cosine * x + sine * y, ry = sine * x + cosine * y;
  const bounds = { left: stamp.x - rx - 2, top: stamp.y - ry - 2, right: stamp.x + rx + 2, bottom: stamp.y + ry + 2 };
  if (!stamp.drip) return bounds;
  const progress = getDripProgress(stamp.drip, now);
  const endX = stamp.drip.origin.x + stamp.drip.bend * progress;
  const endY = stamp.drip.origin.y + stamp.drip.length * progress;
  const radius = stamp.drip.width + 2;
  bounds.left = Math.min(bounds.left, stamp.drip.origin.x - radius, endX - radius);
  bounds.top = Math.min(bounds.top, stamp.drip.origin.y - radius, endY - radius);
  bounds.right = Math.max(bounds.right, stamp.drip.origin.x + radius, endX + radius);
  bounds.bottom = Math.max(bounds.bottom, stamp.drip.origin.y + radius, endY + radius);
  return bounds;
}

function groupBounds(stamps: readonly PaintStamp[], width: number, height: number, dpr: number) {
  let left = width, top = height, right = 0, bottom = 0;
  for (const stamp of stamps) {
    const cosine = Math.abs(Math.cos(stamp.direction)), sine = Math.abs(Math.sin(stamp.direction));
    const x = TEXTURE_HALF_SIZE * stamp.bodyWidth / TEXTURE_RADIUS_X;
    const y = TEXTURE_HALF_SIZE * stamp.bodyHeight / TEXTURE_RADIUS_Y;
    const rx = cosine * x + sine * y, ry = sine * x + cosine * y;
    left = Math.min(left, stamp.x - rx); right = Math.max(right, stamp.x + rx);
    top = Math.min(top, stamp.y - ry); bottom = Math.max(bottom, stamp.y + ry);
  }
  // Clip to the destination and keep translation aligned to integer device pixels.
  const x = Math.max(0, Math.floor(left * dpr) - 2), y = Math.max(0, Math.floor(top * dpr) - 2);
  return { x, y, width: Math.min(Math.round(width * dpr), Math.ceil(right * dpr) + 2) - x,
    height: Math.min(Math.round(height * dpr), Math.ceil(bottom * dpr) + 2) - y };
}

// Reference drawing order: each stamp immediately followed by its own drip.
export function drawPaintStamp(context: CanvasRenderingContext2D, stamp: PaintStamp, now: number, textures: Textures) {
  const fade = getPaintOpacity(stamp.createdAt, now);
  context.fillStyle = stamp.color;
  context.save();
  context.translate(stamp.x, stamp.y);
  context.rotate(stamp.direction);
  context.scale(stamp.bodyWidth / TEXTURE_RADIUS_X, stamp.bodyHeight / TEXTURE_RADIUS_Y);
  context.globalAlpha = fade * stamp.density;
  context.drawImage(textures.get(stamp), -TEXTURE_HALF_SIZE, -TEXTURE_HALF_SIZE, TEXTURE_HALF_SIZE * 2, TEXTURE_HALF_SIZE * 2);
  context.restore();
  if (stamp.drip) {
    const drip = stamp.drip;
    const progress = getDripProgress(drip, now);
    if (progress <= 0) return;
    const endX = drip.origin.x + drip.bend * progress;
    const endY = drip.origin.y + drip.length * progress;
    context.globalAlpha = 0.9 * fade * stamp.density;
    context.strokeStyle = stamp.color;
    context.lineWidth = drip.width;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(drip.origin.x, drip.origin.y);
    context.quadraticCurveTo(drip.origin.x, drip.origin.y + drip.length * progress * 0.5, endX, endY);
    context.stroke();
    context.beginPath();
    context.ellipse(endX, endY, drip.width * 0.7, drip.width * 0.95, 0, 0, Math.PI * 2);
    context.fill();
  }
}

export function createSprayRenderer(context: CanvasRenderingContext2D, textures: Textures, { maxCacheBytes = 16 * 1024 * 1024 } = {}) {
  const groups = createStampGroups();
  const cache = new Map<number, Surface>();
  const failed = new Set<number>();
  let cacheBytes = 0;
  let geometry = "";
  let initialized = false;
  let snapshots = new Map<PaintStamp, Snapshot>();
  const release = (id: number) => {
    const surface = cache.get(id);
    if (!surface) return;
    cacheBytes -= surface.bytes;
    surface.canvas.width = surface.canvas.height = 0;
    cache.delete(id);
  };
  const clear = () => {
    for (const id of cache.keys()) release(id);
    failed.clear(); groups.clear(); snapshots = new Map(); geometry = ""; initialized = false;
  };
  return {
    render(stamps: readonly PaintStamp[], now: number, width: number, height: number, dpr: number) {
      const nextGeometry = `${width}:${height}:${dpr}`;
      if (geometry !== nextGeometry) { clear(); geometry = nextGeometry; }
      const dirty = createSprayDirtyTiles(width, height, dpr);
      const { pixelWidth, pixelHeight } = dirty;
      const nextSnapshots = new Map<PaintStamp, Snapshot>();
      const appended: PaintStamp[] = [];
      for (const stamp of stamps) {
        const next = { bounds: stampBounds(stamp, now), opacity: getPaintOpacity(stamp.createdAt, now),
          dripProgress: stamp.drip ? getDripProgress(stamp.drip, now) : -1 };
        const previous = snapshots.get(stamp);
        if (!previous) appended.push(stamp);
        else if (previous.opacity !== next.opacity || previous.dripProgress !== next.dripProgress) {
          dirty.mark(previous.bounds);
          dirty.mark(next.bounds);
        }
        nextSnapshots.set(stamp, next);
      }
      for (const [stamp, previous] of snapshots) if (!nextSnapshots.has(stamp)) dirty.mark(previous.bounds);
      snapshots = nextSnapshots;
      if (!initialized) {
        dirty.mark({ left: 0, top: 0, right: width, bottom: height });
        initialized = true;
      }

      // New stamps are append-only and already have the highest paint order. If no
      // existing pixels changed, draw them directly without clearing any old paint.
      // When another change dirties the frame, include their complete bounds in the
      // replay region so clipped drawing cannot cut off the new texture.
      if (dirty.size > 0) for (const stamp of appended) dirty.mark(snapshots.get(stamp)!.bounds);

      const selected = groups.select(stamps, stamp => !stamp.drip && getPaintOpacity(stamp.createdAt, now) === 1);
      const eligible = new Set(selected.filter(group => group.cacheable).map(group => group.id));
      for (const id of cache.keys()) if (!eligible.has(id)) release(id);
      for (const id of failed) if (!eligible.has(id)) failed.delete(id);
      let cachedGroups = 0, bakedStamps = 0, individualStamps = 0;

      for (const group of selected) {
        let surface = cache.get(group.id);
        if (!surface && group.cacheable && !failed.has(group.id) && maxCacheBytes > 0) {
          const bounds = groupBounds(group.stamps, width, height, dpr);
          const bytes = bounds.width * bounds.height * 4;
          if (bounds.width > 0 && bounds.height > 0 && bounds.width <= MAX_SURFACE_DIMENSION &&
              bounds.height <= MAX_SURFACE_DIMENSION && bytes <= maxCacheBytes - cacheBytes) {
            const canvas = document.createElement("canvas");
            try {
              canvas.width = bounds.width; canvas.height = bounds.height;
              const target = canvas.getContext("2d");
              if (!target) throw new Error("No group canvas context");
              target.setTransform(dpr, 0, 0, dpr, -bounds.x, -bounds.y);
              for (const stamp of group.stamps) drawPaintStamp(target, stamp, now, textures);
              surface = { canvas, x: bounds.x, y: bounds.y, bytes };
              cache.set(group.id, surface); cacheBytes += bytes; bakedStamps += group.stamps.length;
            } catch {
              canvas.width = canvas.height = 0;
              failed.add(group.id); // Allocation failure: reference path, no per-frame retry loop.
            }
          }
        }
        if (surface) cachedGroups++;
        else individualStamps += group.stamps.length;
      }

      if (dirty.size === 0) {
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        for (const stamp of appended) drawPaintStamp(context, stamp, now, textures);
        context.globalAlpha = 1;
        return { cachedGroups, bakedStamps, individualStamps, cacheBytes,
          dirtyTiles: 0, clearedPixels: 0, drawnGroups: 0, redrawnStamps: appended.length,
          incrementalStamps: appended.length };
      }

      // Clear and clip in device pixels so neighbouring tiles share exact boundaries.
      const deviceClip = new Path2D();
      const clearedPixels = dirty.countClearedPixels();
      const dirtyBounds = dirty.getClipBounds();
      for (const tile of dirtyBounds) {
        const left = Math.round(tile.left * dpr), top = Math.round(tile.top * dpr);
        const right = Math.round(tile.right * dpr), bottom = Math.round(tile.bottom * dpr);
        deviceClip.rect(left, top, right - left, bottom - top);
      }
      context.save();
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clip(deviceClip);
      context.clearRect(0, 0, pixelWidth, pixelHeight);
      context.restore();

      const cssClip = new Path2D();
      for (const tile of dirtyBounds) cssClip.rect(tile.left, tile.top, tile.right - tile.left, tile.bottom - tile.top);
      context.save();
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clip(cssClip);
      let drawnGroups = 0, redrawnStamps = 0;
      for (const group of selected) {
        const surface = cache.get(group.id);
        if (surface) {
          const bounds = { left: surface.x / dpr, top: surface.y / dpr,
            right: (surface.x + surface.canvas.width) / dpr, bottom: (surface.y + surface.canvas.height) / dpr };
          if (!dirty.touches(bounds)) continue;
          context.globalAlpha = 1;
          // Group alpha must stay 1: fading a pre-composited group changes overlap density.
          context.drawImage(surface.canvas, bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top);
          drawnGroups++;
        } else {
          for (const stamp of group.stamps) {
            const snapshot = snapshots.get(stamp);
            if (!snapshot || !dirty.touches(snapshot.bounds)) continue;
            drawPaintStamp(context, stamp, now, textures);
            redrawnStamps++;
          }
        }
      }
      context.restore();
      context.globalAlpha = 1;
      return { cachedGroups, bakedStamps, individualStamps, cacheBytes,
        dirtyTiles: dirty.size, clearedPixels, drawnGroups, redrawnStamps, incrementalStamps: 0 };
    },
    clear,
  };
}
