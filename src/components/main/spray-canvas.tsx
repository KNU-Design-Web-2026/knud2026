"use client";

import { useEffect, useRef } from "react";

import {
  createPaintDrip, createPaintStamp, DRIP_COOLDOWN, DRIP_SETTLE_TIME,
  getDripProgress, getPaintOpacity, MAX_ACTIVE_DRIPS, PAINT_LIFETIME,
} from "./spray-paint";
import type { PaintStamp, Point } from "./spray-paint";

const STAMP_SPACING = 12;
const MAX_DEVICE_PIXEL_RATIO = 2;
const SPRAY_COLORS = ["#F8D622", "#FF3030", "#F7F7F2", "#FD9519", "#41C9F9"];
const SLOW_SPEED = 0.22; // CSS px/ms; mouse pressure is not a force measurement.

export function SprayCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const hero = document.getElementById("main-hero");
    const sprayZone = document.getElementById("main-spray-zone");
    const canvas = canvasRef.current;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!hero || !sprayZone || !canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let stamps: PaintStamp[] = [];
    let lastPoint: Point | null = null;
    let latestInput: (Point & { at: number }) | null = null;
    let pointerId: number | null = null;
    let frame: number | null = null;
    let colorIndex = -1;
    let activeColor = SPRAY_COLORS[0];
    let settledSince = 0;
    let lastDripAt = -Infinity;
    let width = 0;
    let height = 0;
    const enabled = () => finePointer.matches && !reducedMotion.matches;

    const resizeCanvas = () => {
      ({ height, width } = hero.getBoundingClientRect());
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Existing marks use coordinates from the old artwork dimensions.
      stamps = [];
      lastPoint = null;
      latestInput = null;
    };

    const render = (now: number) => {
      context.clearRect(0, 0, width, height);
      stamps = stamps.filter((stamp) => now - stamp.createdAt < PAINT_LIFETIME);

      const wetStamp = stamps.at(-1);
      if (pointerId !== null && latestInput && wetStamp && !wetStamp.drip &&
          now - settledSince >= DRIP_SETTLE_TIME && now - lastDripAt >= DRIP_COOLDOWN &&
          now - wetStamp.createdAt < 900 &&
          Math.hypot(latestInput.x - wetStamp.x, latestInput.y - wetStamp.y) < wetStamp.bodyHeight &&
          stamps.filter((stamp) => stamp.drip !== null).length < MAX_ACTIVE_DRIPS) {
        wetStamp.drip = createPaintDrip(wetStamp, now);
        lastDripAt = now;
      }

      for (const stamp of stamps) {
        const fade = getPaintOpacity(stamp.createdAt, now);
        context.fillStyle = stamp.color;
        context.save();
        context.translate(stamp.x, stamp.y);
        context.rotate(stamp.direction);
        context.globalAlpha = 0.86 * fade;
        context.beginPath();
        stamp.edgePoints.forEach((point, index) => {
          if (index === 0) context.moveTo(point.x, point.y);
          else context.lineTo(point.x, point.y);
        });
        context.closePath();
        context.fill();
        context.restore();

        for (const particle of stamp.particles) {
          context.globalAlpha = particle.alpha * fade;
          context.beginPath();
          context.arc(stamp.x + particle.x, stamp.y + particle.y, particle.radius, 0, Math.PI * 2);
          context.fill();
        }

        if (stamp.drip) {
          const drip = stamp.drip;
          const progress = getDripProgress(drip, now);
          if (progress <= 0) continue;
          const endX = drip.origin.x + drip.bend * progress;
          const endY = drip.origin.y + drip.length * progress;
          context.globalAlpha = 0.9 * fade;
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
      context.globalAlpha = 1;
      frame = pointerId !== null || stamps.length > 0 ? window.requestAnimationFrame(render) : null;
    };

    const addStamp = (point: Point, direction: number) => {
      stamps.push(createPaintStamp(point, performance.now(), direction, activeColor));
      if (frame === null) frame = window.requestAnimationFrame(render);
    };

    const pointFromEvent = (event: PointerEvent): Point => {
      const bounds = hero.getBoundingClientRect();
      return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    };

    const sprayAlongPath = (next: Point) => {
      if (!lastPoint) { addStamp(next, 0); lastPoint = next; return; }
      const dx = next.x - lastPoint.x;
      const dy = next.y - lastPoint.y;
      const distance = Math.hypot(dx, dy);
      const steps = Math.min(Math.floor(distance / STAMP_SPACING), 10);
      if (steps === 0) return;
      const direction = Math.atan2(dy, dx);
      for (let step = 1; step <= steps; step += 1) {
        const progress = step * STAMP_SPACING / distance;
        addStamp({ x: lastPoint.x + dx * progress, y: lastPoint.y + dy * progress }, direction);
      }
      const covered = steps * STAMP_SPACING / distance;
      lastPoint = { x: lastPoint.x + dx * covered, y: lastPoint.y + dy * covered };
    };

    const stop = () => {
      const capturedId = pointerId;
      pointerId = null;
      lastPoint = null;
      latestInput = null;
      if (capturedId !== null && sprayZone.hasPointerCapture(capturedId)) sprayZone.releasePointerCapture(capturedId);
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (!enabled() || event.button !== 0 || pointerId !== null) return;
      pointerId = event.pointerId;
      colorIndex = (colorIndex + 1) % SPRAY_COLORS.length;
      activeColor = SPRAY_COLORS[colorIndex];
      sprayZone.setPointerCapture(event.pointerId);
      const point = pointFromEvent(event);
      settledSince = performance.now();
      latestInput = { ...point, at: settledSince };
      lastPoint = point;
      addStamp(point, 0);
    };
    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      const point = pointFromEvent(event);
      const now = performance.now();
      if (latestInput && Math.hypot(point.x - latestInput.x, point.y - latestInput.y) / Math.max(1, now - latestInput.at) > SLOW_SPEED) {
        settledSince = now;
      }
      latestInput = { ...point, at: now };
      sprayAlongPath(point);
    };
    const handlePointerEnd = (event: PointerEvent) => {
      if (event.pointerId === pointerId) stop();
    };
    const reset = () => {
      stop();
      stamps = [];
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = null;
      context.clearRect(0, 0, width, height);
    };
    const handleVisibility = () => { if (document.hidden) reset(); };

    resizeCanvas();
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(hero);
    sprayZone.addEventListener("pointerdown", handlePointerDown);
    sprayZone.addEventListener("pointermove", handlePointerMove);
    sprayZone.addEventListener("pointerup", handlePointerEnd);
    sprayZone.addEventListener("pointercancel", handlePointerEnd);
    sprayZone.addEventListener("lostpointercapture", handlePointerEnd);
    finePointer.addEventListener("change", reset);
    reducedMotion.addEventListener("change", reset);
    window.addEventListener("blur", reset);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      reset();
      resizeObserver.disconnect();
      sprayZone.removeEventListener("pointerdown", handlePointerDown);
      sprayZone.removeEventListener("pointermove", handlePointerMove);
      sprayZone.removeEventListener("pointerup", handlePointerEnd);
      sprayZone.removeEventListener("pointercancel", handlePointerEnd);
      sprayZone.removeEventListener("lostpointercapture", handlePointerEnd);
      finePointer.removeEventListener("change", reset);
      reducedMotion.removeEventListener("change", reset);
      window.removeEventListener("blur", reset);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return <canvas className="pointer-events-none absolute inset-0 z-10 size-full" ref={canvasRef} aria-hidden="true" />;
}
