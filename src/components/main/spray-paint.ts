// CSS-pixel dimensions: DPR changes resolution, never the grain or brush size.
export const PAINT_LIFETIME = 6_600;
export const PAINT_HOLD = 5_400;
export const DRIP_SETTLE_TIME = 240;
export const DRIP_COOLDOWN = 420;
export const DRIP_ELIGIBILITY_TIME = 900;
export const MAX_ACTIVE_DRIPS = 8;
export const DRIP_MIN_SEPARATION = 56;
export const TEXTURE_RADIUS_X = 27;
export const TEXTURE_RADIUS_Y = 21;
export const TEXTURE_HALF_SIZE = 84;
export const GRAIN_COUNT = 2200;

export type Point = { x: number; y: number };
export type PaintDrip = {
  startedAt: number;
  duration: number;
  length: number;
  width: number;
  bend: number;
  origin: Point;
};
export type PaintStamp = Point & {
  color: string;
  density: number;
  createdAt: number;
  direction: number;
  bodyWidth: number;
  bodyHeight: number;
  // Shared immutable local-space grain template; rotation happens when drawing.
  particles: readonly (Point & { radius: number; alpha: number })[];
  dripAt: number | null;
  drip: PaintDrip | null;
};

const grainTemplates = new Map<number, PaintStamp["particles"]>();

// Sample at deposition, not per frame: existing paint never flickers.
export function createPaintDensity(random = Math.random): () => number {
  let start = 0.9;
  let target = 0.58 + random() * 0.12;
  let length = 6 + Math.floor(random() * 9);
  let step = 0;
  let dense = false;
  return () => {
    const t = ++step / length;
    const value = start + (target - start) * t * t * (3 - 2 * t);
    if (step === length) {
      start = target;
      dense = !dense;
      target = dense ? 0.95 + random() * 0.05 : 0.58 + random() * 0.12;
      length = 6 + Math.floor(random() * 9);
      step = 0;
    }
    return value;
  };
}

function getGrainTemplate(variant: number, hasBackscatter: boolean): PaintStamp["particles"] {
  const key = variant * 2 + Number(hasBackscatter);
  const existing = grainTemplates.get(key);
  if (existing) return existing;
  let seed = 173 + variant * 7919;
  const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
  const particles = Array.from({ length: GRAIN_COUNT }, (_, index) => {
    const isBackscatter = hasBackscatter && index >= GRAIN_COUNT - 24;
    const angle = isBackscatter
      ? Math.PI + (random() - 0.5) * 1.7
      : random() * Math.PI * 2;
    const isOverspray = index >= 1800;
    // Truncated Gaussian deposition: a dense, porous center, not a solid disc.
    // The sparse outer layer breaks the silhouette without blur or large blobs.
    const distance = isBackscatter
      ? 1.5 + random() ** 2 * 1.35
      : isOverspray ? 0.85 + random() ** 1.6 * 1.4
      : Math.sqrt(-2 * Math.log(1 - random() * 0.995)) * 0.48;
    return {
      x: Math.cos(angle) * TEXTURE_RADIUS_X * distance,
      y: Math.sin(angle) * TEXTURE_RADIUS_Y * distance,
      radius: isBackscatter ? 0.35 + random() * 0.65 : isOverspray ? 0.2 + random() * 0.4 : 0.25 + random() * 0.45,
      alpha: isOverspray ? 0.3 + random() * 0.55 : 0.55 + random() * 0.4,
    };
  });
  grainTemplates.set(key, particles);
  return particles;
}

export function createPaintStamp(point: Point, createdAt: number, direction: number | null, color: string, random = Math.random): PaintStamp {
  const bodyWidth = 25 + random() * 4;
  const bodyHeight = 19 + random() * 4;
  const hasBackscatter = direction !== null && random() < 0.38;
  const particles = getGrainTemplate(Math.floor(random() * 12), hasBackscatter);
  return { ...point, color, density: 1, createdAt, direction: direction ?? 0, bodyWidth, bodyHeight, particles, dripAt: null, drip: null };
}

export function canStartPaintDrip(stamps: PaintStamp[], candidate: PaintStamp, now: number, lastDripAt: number): boolean {
  if (candidate.drip || now - candidate.createdAt >= DRIP_ELIGIBILITY_TIME || now - lastDripAt < DRIP_COOLDOWN) return false;
  const active = stamps.filter((stamp) => stamp.drip !== null && now - stamp.createdAt < PAINT_LIFETIME);
  return active.length < MAX_ACTIVE_DRIPS && active.every((stamp) =>
    Math.hypot(stamp.x - candidate.x, stamp.y - candidate.y) >= DRIP_MIN_SEPARATION);
}

export function findScheduledDrip(stamps: PaintStamp[], now: number, lastDripAt: number): PaintStamp | undefined {
  return stamps.find((stamp) => stamp.dripAt !== null && now >= stamp.dripAt &&
    canStartPaintDrip(stamps, stamp, now, lastDripAt));
}

export function createPaintDrip(stamp: PaintStamp, now: number, random = Math.random): PaintDrip {
  // Attach just inside the ellipse's world-space lower edge. Flow stays vertical
  // even if the user drew upwards or sideways.
  const sine = Math.sin(stamp.direction);
  const cosine = Math.cos(stamp.direction);
  const lowerEdge = Math.hypot(stamp.bodyWidth * sine, stamp.bodyHeight * cosine);
  const lowerX = (stamp.bodyWidth ** 2 - stamp.bodyHeight ** 2) * sine * cosine / lowerEdge;
  return {
    startedAt: now,
    duration: 900 + random() * 300,
    length: 38 + random() * 54,
    width: 1.3 + random() * 1.3,
    bend: (random() - 0.5) * 3,
    origin: { x: stamp.x + lowerX * 0.82, y: stamp.y + lowerEdge * 0.82 },
  };
}

export function getDripProgress(drip: PaintDrip, now: number): number {
  const elapsed = Math.max(0, Math.min(1, (now - drip.startedAt) / drip.duration));
  return 1 - (1 - elapsed) ** 2;
}

export function getPaintOpacity(createdAt: number, now: number): number {
  return Math.max(0, Math.min(1, (PAINT_LIFETIME - (now - createdAt)) / (PAINT_LIFETIME - PAINT_HOLD)));
}
