"use client";

import { useEffect, useRef } from "react";

import {
  compactActiveStamps,
  createSprayStamp,
  type Point,
  type SprayStamp,
} from "./spray-model";
import {
  createParticlePathCache,
  type SprayParticlePath,
} from "./spray-path-cache";

const STAMP_SPACING = 12;
const STAMP_DURATION = 2_400;
const STAMP_VISIBLE_DURATION = 1_800;
const MAX_DEVICE_PIXEL_RATIO = 2;
const SPRAY_COLORS = ["#F8D622", "#FF3030", "#F7F7F2", "#FD9519", "#41C9F9"];

export function SprayCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stampsRef = useRef<SprayStamp[]>([]);
  const lastPointRef = useRef<Point | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const isSprayingRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const colorIndexRef = useRef(-1);
  const activeColorRef = useRef(SPRAY_COLORS[0]);
  const canvasSizeRef = useRef({ height: 0, width: 0 });
  const particlePathCacheRef = useRef(
    new WeakMap<SprayStamp, SprayParticlePath[]>(),
  );

  useEffect(() => {
    const hero = document.getElementById("main-hero");
    const sprayZone = document.getElementById("main-spray-zone");
    const canvas = canvasRef.current;
    const supportsFinePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    );
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    if (!hero || !sprayZone || !canvas || !supportsFinePointer.matches || prefersReducedMotion.matches) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const resizeCanvas = () => {
      const { height, width } = hero.getBoundingClientRect();
      const devicePixelRatio = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);

      canvasSizeRef.current = { height, width };
      canvas.width = Math.round(width * devicePixelRatio);
      canvas.height = Math.round(height * devicePixelRatio);
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };

    const render = (now: number) => {
      const { height, width } = canvasSizeRef.current;

      context.clearRect(0, 0, width, height);
      compactActiveStamps(stampsRef.current, now, STAMP_DURATION);

      for (const stamp of stampsRef.current) {
        const age = now - stamp.createdAt;
        const fade = age <= STAMP_VISIBLE_DURATION
          ? 1
          : (STAMP_DURATION - age) / (STAMP_DURATION - STAMP_VISIBLE_DURATION);

        context.strokeStyle = stamp.color;
        context.fillStyle = stamp.color;
        context.save();
        context.translate(stamp.x, stamp.y);
        context.rotate(stamp.direction);
        context.globalAlpha = 0.3 * fade;
        context.beginPath();
        stamp.edgePoints.forEach((edgePoint, index) => {
          if (index === 0) {
            context.moveTo(edgePoint.x, edgePoint.y);
            return;
          }

          context.lineTo(edgePoint.x, edgePoint.y);
        });
        context.closePath();
        context.fill();
        context.restore();

        const particlePaths = particlePathCacheRef.current.get(stamp);

        if (particlePaths) {
          context.save();
          context.translate(stamp.x, stamp.y);

          for (const particlePath of particlePaths) {
            context.globalAlpha = particlePath.alpha * fade;
            context.fill(particlePath.path);
          }

          context.restore();
        }

        if (stamp.drip) {
          const startX = stamp.x + stamp.drip.offsetX;
          const startY = stamp.y + stamp.bodyHeight * 0.45;
          const middleX = startX + stamp.drip.bend * 0.38;
          const middleY = startY + stamp.drip.length * 0.46;
          const endX = startX + stamp.drip.bend;
          const endY = startY + stamp.drip.length;

          context.save();
          context.globalAlpha = 0.68 * fade;
          context.lineJoin = "miter";
          context.beginPath();
          context.moveTo(startX - stamp.drip.width * 0.55, startY);
          context.lineTo(middleX - stamp.drip.width * 0.4, middleY);
          context.lineTo(endX - stamp.drip.tipRadius * 0.15, endY - stamp.drip.tipRadius);
          context.lineTo(endX + stamp.drip.tipRadius, endY);
          context.lineTo(endX - stamp.drip.tipRadius * 0.7, endY + stamp.drip.tipRadius * 0.35);
          context.lineTo(middleX + stamp.drip.width * 0.52, middleY + stamp.drip.width * 0.4);
          context.lineTo(startX + stamp.drip.width * 0.72, startY);
          context.closePath();
          context.fill();
          context.restore();
        }
      }

      context.globalAlpha = 1;

      if (isSprayingRef.current || stampsRef.current.length > 0) {
        animationFrameRef.current = window.requestAnimationFrame(render);
      } else {
        animationFrameRef.current = null;
      }
    };

    const startRendering = () => {
      if (animationFrameRef.current === null) {
        animationFrameRef.current = window.requestAnimationFrame(render);
      }
    };

    const addStamp = (point: Point, direction: number) => {
      const stamp = createSprayStamp(
        point,
        performance.now(),
        direction,
        activeColorRef.current,
      );

      particlePathCacheRef.current.set(
        stamp,
        createParticlePathCache(stamp.particles),
      );
      stampsRef.current.push(stamp);

      startRendering();
    };

    const pointFromEvent = (event: PointerEvent): Point => {
      const bounds = hero.getBoundingClientRect();

      return {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      };
    };

    const sprayAlongPath = (nextPoint: Point) => {
      const previousPoint = lastPointRef.current;

      if (!previousPoint) {
        addStamp(nextPoint, 0);
        lastPointRef.current = nextPoint;
        return;
      }

      const deltaX = nextPoint.x - previousPoint.x;
      const deltaY = nextPoint.y - previousPoint.y;
      const distance = Math.hypot(deltaX, deltaY);
      const steps = Math.min(Math.floor(distance / STAMP_SPACING), 10);
      const direction = Math.atan2(deltaY, deltaX);

      if (steps === 0) {
        return;
      }

      for (let step = 1; step <= steps; step += 1) {
        const progress = (step * STAMP_SPACING) / distance;
        addStamp(
          {
            x: previousPoint.x + deltaX * progress,
            y: previousPoint.y + deltaY * progress,
          },
          direction,
        );
      }

      const coveredDistance = steps * STAMP_SPACING;
      lastPointRef.current = {
        x: previousPoint.x + (deltaX * coveredDistance) / distance,
        y: previousPoint.y + (deltaY * coveredDistance) / distance,
      };
    };

    const stopSpraying = (event: PointerEvent) => {
      if (event.pointerId !== activePointerIdRef.current) {
        return;
      }

      isSprayingRef.current = false;
      lastPointRef.current = null;
      activePointerIdRef.current = null;

      if (sprayZone.hasPointerCapture(event.pointerId)) {
        sprayZone.releasePointerCapture(event.pointerId);
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) {
        return;
      }

      activePointerIdRef.current = event.pointerId;
      isSprayingRef.current = true;
      colorIndexRef.current = (colorIndexRef.current + 1) % SPRAY_COLORS.length;
      activeColorRef.current = SPRAY_COLORS[colorIndexRef.current];
      sprayZone.setPointerCapture(event.pointerId);
      const point = pointFromEvent(event);
      lastPointRef.current = point;
      addStamp(point, 0);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!isSprayingRef.current || event.pointerId !== activePointerIdRef.current) {
        return;
      }

      sprayAlongPath(pointFromEvent(event));
    };

    resizeCanvas();

    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(hero);
    sprayZone.addEventListener("pointerdown", handlePointerDown);
    sprayZone.addEventListener("pointermove", handlePointerMove);
    sprayZone.addEventListener("pointerup", stopSpraying);
    sprayZone.addEventListener("pointercancel", stopSpraying);

    return () => {
      resizeObserver.disconnect();
      sprayZone.removeEventListener("pointerdown", handlePointerDown);
      sprayZone.removeEventListener("pointermove", handlePointerMove);
      sprayZone.removeEventListener("pointerup", stopSpraying);
      sprayZone.removeEventListener("pointercancel", stopSpraying);

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return <canvas className="pointer-events-none absolute inset-0 z-10 size-full" ref={canvasRef} aria-hidden="true" />;
}
