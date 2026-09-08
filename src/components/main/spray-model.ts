const SPRAY_SCALE = 1.9;

export type Point = {
  x: number;
  y: number;
};

export type SprayParticle = {
  alpha: number;
  radius: number;
  x: number;
  y: number;
};

export type SprayEdgePoint = {
  x: number;
  y: number;
};

export type SprayDrip = {
  bend: number;
  length: number;
  offsetX: number;
  tipRadius: number;
  width: number;
};

export type SprayStamp = Point & {
  bodyHeight: number;
  bodyWidth: number;
  color: string;
  createdAt: number;
  direction: number;
  drip: SprayDrip | null;
  edgePoints: SprayEdgePoint[];
  particles: SprayParticle[];
};

export type RandomSource = () => number;

export function createSeededRandom(seed: number): RandomSource {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export function parseSpraySeed(value: string | null): number | null {
  if (value === null || !/^\d+$/.test(value)) {
    return null;
  }

  const seed = Number(value);
  return Number.isSafeInteger(seed) && seed <= 0xffff_ffff ? seed : null;
}

export function compactActiveStamps(
  stamps: SprayStamp[],
  now: number,
  duration: number,
): number {
  let writeIndex = 0;

  for (let readIndex = 0; readIndex < stamps.length; readIndex += 1) {
    const stamp = stamps[readIndex];

    if (now - stamp.createdAt >= duration) {
      continue;
    }

    stamps[writeIndex] = stamp;
    writeIndex += 1;
  }

  stamps.length = writeIndex;
  return writeIndex;
}

export function createSprayStamp(
  point: Point,
  createdAt: number,
  direction: number,
  color: string,
  random: RandomSource = Math.random,
): SprayStamp {
  const particles: SprayParticle[] = [];
  const bodyWidth = (32 + random() * 18) * SPRAY_SCALE;
  const bodyHeight = (7 + random() * 5) * SPRAY_SCALE;
  const edgePoints: SprayEdgePoint[] = Array.from({ length: 20 }, (_, index) => {
    const angle = (index / 20) * Math.PI * 2;
    const edgeJitter = 0.72 + random() * 0.48;
    const tooth = index % 3 === 0 ? 1.14 : 1;

    return {
      x: Math.cos(angle) * bodyWidth * edgeJitter * tooth,
      y: Math.sin(angle) * bodyHeight * edgeJitter,
    };
  });

  for (let index = 0; index < 82; index += 1) {
    const isOverspray = index >= 52;
    const localX = (random() - 0.5) * (isOverspray ? 118 : 72) * SPRAY_SCALE;
    const localY = (random() - 0.5) * (isOverspray ? 56 : 30) * SPRAY_SCALE;
    const cosine = Math.cos(direction);
    const sine = Math.sin(direction);

    particles.push({
      x: localX * cosine - localY * sine,
      y: localX * sine + localY * cosine,
      radius: (isOverspray ? 0.35 + random() * 1.35 : 0.7 + random() * 2.8) * SPRAY_SCALE,
      alpha: isOverspray ? 0.08 + random() * 0.3 : 0.28 + random() * 0.58,
    });
  }

  return {
    ...point,
    bodyHeight,
    bodyWidth,
    color,
    createdAt,
    direction,
    drip: random() < 0.075
      ? {
          bend: (random() - 0.5) * 14 * SPRAY_SCALE,
          offsetX: (random() - 0.5) * bodyWidth,
          length: (24 + random() * 52) * SPRAY_SCALE,
          tipRadius: (1.5 + random() * 3.5) * SPRAY_SCALE,
          width: (1.5 + random() * 3.5) * SPRAY_SCALE,
        }
      : null,
    edgePoints,
    particles,
  };
}
