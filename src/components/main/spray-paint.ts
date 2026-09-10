// CSS-pixel dimensions: DPR changes resolution, never the grain or brush size.
export const PAINT_LIFETIME = 3_600;
export const PAINT_HOLD = 2_800;
export const DRIP_SETTLE_TIME = 240;
export const DRIP_COOLDOWN = 420;
export const MAX_ACTIVE_DRIPS = 8;
export const DRIP_MIN_SEPARATION = 56;

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
  createdAt: number;
  direction: number;
  bodyWidth: number;
  bodyHeight: number;
  edgePoints: Point[];
  particles: (Point & { radius: number; alpha: number })[];
  dripAt: number | null;
  drip: PaintDrip | null;
};

export function createPaintStamp(point: Point, createdAt: number, direction: number | null, color: string, random = Math.random): PaintStamp {
  const bodyWidth = 25 + random() * 4;
  const bodyHeight = 19 + random() * 4;
  const orientation = direction ?? 0;
  const cosine = Math.cos(orientation);
  const sine = Math.sin(orientation);
  // Sparse bursts, not an even halo or a continuous tail. A click has no
  // travel direction, so it keeps the original all-around overspray.
  const hasBackscatter = direction !== null && random() < 0.38;
  const edgePoints = Array.from({ length: 48 }, (_, index) => {
    const angle = (index / 48) * Math.PI * 2;
    const edgeJitter = 0.94 + random() * 0.12;
    return { x: Math.cos(angle) * bodyWidth * edgeJitter, y: Math.sin(angle) * bodyHeight * edgeJitter };
  });
  const particles = Array.from({ length: 96 }, (_, index) => {
    const isBackscatter = hasBackscatter && index >= 90;
    const angle = isBackscatter
      ? Math.PI + (random() - 0.5) * 1.7
      : random() * Math.PI * 2;
    const isOverspray = index >= 76;
    const distance = isBackscatter
      ? 1.5 + random() ** 2 * 1.35
      : isOverspray ? 1.12 + random() * 0.8 : 0.88 + random() * 0.35;
    const localX = Math.cos(angle) * bodyWidth * distance;
    const localY = Math.sin(angle) * bodyHeight * distance;
    return {
      x: localX * cosine - localY * sine,
      y: localX * sine + localY * cosine,
      radius: isBackscatter ? 0.35 + random() * 0.8 : isOverspray ? 0.25 + random() * 0.65 : 0.3 + random() * 0.85,
      alpha: isBackscatter ? 0.35 + random() * 0.4 : isOverspray ? 0.2 + random() * 0.25 : 0.45 + random() * 0.4,
    };
  });
  return { ...point, color, createdAt, direction: orientation, bodyWidth, bodyHeight, edgePoints, particles, dripAt: null, drip: null };
}

export function canStartPaintDrip(stamps: PaintStamp[], candidate: PaintStamp, now: number, lastDripAt: number): boolean {
  if (candidate.drip || now - candidate.createdAt >= 900 || now - lastDripAt < DRIP_COOLDOWN) return false;
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
