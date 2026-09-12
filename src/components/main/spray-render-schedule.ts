import type { PaintStamp } from "./spray-paint";

export type SprayRenderPlan = { animate: boolean; wakeAt: number | null };
export type SprayRenderTiming = { dripEligibilityTime: number; paintHold: number; paintLifetime: number };

export function getSprayRenderPlan(
  stamps: readonly PaintStamp[],
  now: number,
  timing: SprayRenderTiming,
  externalWakeTimes: readonly number[] = [],
): SprayRenderPlan {
  let wakeAt = Infinity;

  for (const stamp of stamps) {
    const holdAt = stamp.createdAt + timing.paintHold;
    const expiresAt = stamp.createdAt + timing.paintLifetime;
    if (now >= expiresAt) continue;
    if (now >= holdAt) return { animate: true, wakeAt: null };
    wakeAt = Math.min(wakeAt, holdAt);

    if (stamp.drip && now < stamp.drip.startedAt + stamp.drip.duration) {
      return { animate: true, wakeAt: null };
    }
    if (!stamp.drip && stamp.dripAt !== null && stamp.dripAt > now &&
        stamp.dripAt < stamp.createdAt + timing.dripEligibilityTime) {
      wakeAt = Math.min(wakeAt, stamp.dripAt);
    }
  }

  for (const candidate of externalWakeTimes) {
    if (candidate > now) wakeAt = Math.min(wakeAt, candidate);
  }
  return { animate: false, wakeAt: Number.isFinite(wakeAt) ? wakeAt : null };
}
