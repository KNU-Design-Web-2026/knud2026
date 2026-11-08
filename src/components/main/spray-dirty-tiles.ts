export type SprayBounds = { left: number; top: number; right: number; bottom: number };

const TILE_DEVICE_SIZE = 256;

export function createSprayDirtyTiles(width: number, height: number, dpr: number) {
  const pixelWidth = Math.round(width * dpr);
  const pixelHeight = Math.round(height * dpr);
  const columns = Math.max(1, Math.ceil(pixelWidth / TILE_DEVICE_SIZE));
  const rows = Math.max(1, Math.ceil(pixelHeight / TILE_DEVICE_SIZE));
  const dirty = new Set<number>();

  function mark(bounds: SprayBounds) {
    const left = Math.max(0, Math.floor(bounds.left * dpr / TILE_DEVICE_SIZE));
    const top = Math.max(0, Math.floor(bounds.top * dpr / TILE_DEVICE_SIZE));
    const right = Math.min(columns - 1, Math.floor((bounds.right * dpr - 1) / TILE_DEVICE_SIZE));
    const bottom = Math.min(rows - 1, Math.floor((bounds.bottom * dpr - 1) / TILE_DEVICE_SIZE));
    if (right < left || bottom < top) return;
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) dirty.add(y * columns + x);
    }
  }

  function touches(bounds: SprayBounds): boolean {
    const left = Math.max(0, Math.floor((bounds.left * dpr - 2) / TILE_DEVICE_SIZE));
    const top = Math.max(0, Math.floor((bounds.top * dpr - 2) / TILE_DEVICE_SIZE));
    const right = Math.min(columns - 1, Math.floor((bounds.right * dpr + 1) / TILE_DEVICE_SIZE));
    const bottom = Math.min(rows - 1, Math.floor((bounds.bottom * dpr + 1) / TILE_DEVICE_SIZE));
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        if (dirty.has(y * columns + x)) return true;
      }
    }
    return false;
  }

  function getClipBounds(): SprayBounds[] {
    return [...dirty].map((id) => {
      const x = id % columns;
      const y = Math.floor(id / columns);
      // Two device pixels of overlap keep antialiasing stable at tile seams.
      return {
        left: Math.max(0, x * TILE_DEVICE_SIZE - 2) / dpr,
        top: Math.max(0, y * TILE_DEVICE_SIZE - 2) / dpr,
        right: Math.min(pixelWidth, (x + 1) * TILE_DEVICE_SIZE + 2) / dpr,
        bottom: Math.min(pixelHeight, (y + 1) * TILE_DEVICE_SIZE + 2) / dpr,
      };
    });
  }

  function countClearedPixels(): number {
    let total = 0;
    for (const id of dirty) {
      const x = id % columns;
      const y = Math.floor(id / columns);
      total += (Math.min(pixelWidth, (x + 1) * TILE_DEVICE_SIZE) - x * TILE_DEVICE_SIZE) *
        (Math.min(pixelHeight, (y + 1) * TILE_DEVICE_SIZE) - y * TILE_DEVICE_SIZE);
    }
    return total;
  }

  return { get size() { return dirty.size; }, pixelWidth, pixelHeight, mark, touches, getClipBounds, countClearedPixels };
}
