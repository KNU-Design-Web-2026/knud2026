// CSS-pixel dimensions: DPR changes resolution, never the grain or brush size.
export const PAINT_LIFETIME = 2_400;
export const PAINT_HOLD = 1_800;
export const DRIP_SETTLE_TIME = 240;
export const DRIP_COOLDOWN = 420;
export const MAX_ACTIVE_DRIPS = 8;

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
  drip: PaintDrip | null;
};

export function createPaintStamp(point: Point, createdAt: number, direction: number, color: string, random = Math.random): PaintStamp {
  const bodyWidth = 25 + random() * 4;
  const bodyHeight = 19 + random() * 4;
  const cosine = Math.cos(direction);
  const sine = Math.sin(direction);
  const edgePoints = Array.from({ length: 48 }, (_, index) => {
    const angle = (index / 48) * Math.PI * 2;
    const edgeJitter = 0.94 + random() * 0.12;
    return { x: Math.cos(angle) * bodyWidth * edgeJitter, y: Math.sin(angle) * bodyHeight * edgeJitter };
  });
  const particles = Array.from({ length: 96 }, (_, index) => {
    const angle = random() * Math.PI * 2;
    const isOverspray = index >= 76;
    const distance = isOverspray ? 1.12 + random() * 0.8 : 0.88 + random() * 0.35;
    const localX = Math.cos(angle) * bodyWidth * distance;
    const localY = Math.sin(angle) * bodyHeight * distance;
    return {
      x: localX * cosine - localY * sine,
      y: localX * sine + localY * cosine,
      radius: isOverspray ? 0.25 + random() * 0.65 : 0.3 + random() * 0.85,
      alpha: isOverspray ? 0.2 + random() * 0.25 : 0.45 + random() * 0.4,
    };
  });
  return { ...point, color, createdAt, direction, bodyWidth, bodyHeight, edgePoints, particles, drip: null };
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
