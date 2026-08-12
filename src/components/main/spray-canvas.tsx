"use client";

import { useEffect, useRef } from "react";

const STAMP_SPACING = 12;
const STAMP_DURATION = 4_000;
const STAMP_VISIBLE_DURATION = 3_000;
const MAX_STAMPS = 180;
const MAX_DEVICE_PIXEL_RATIO = 2;
const SPRAY_SCALE = 1.9;
const MIN_PRESSURE_SCALE = 0.62;
const MAX_PRESSURE_SCALE = 1.55;
const SPRAY_COLORS = ["#F8D622", "#FF3030", "#F7F7F2", "#B6EE57"];

type Point = {
  x: number;
  y: number;
};

type SprayParticle = {
  alpha: number;
  radius: number;
  x: number;
  y: number;
};

type SprayStamp = Point & {
  bodyHeight: number;
  bodyWidth: number;
  color: string;
  createdAt: number;
  direction: number;
  drip: { bend: number; length: number; offsetX: number; width: number } | null;
  particles: SprayParticle[];
  tail: { length: number; spread: number; width: number };
};

function createStamp(
  point: Point,
  createdAt: number,
  direction: number,
  pressureScale: number,
  color: string,
): SprayStamp {
  const particles: SprayParticle[] = [];
  const bodyWidth = (32 + Math.random() * 18) * SPRAY_SCALE * pressureScale;
  const bodyHeight = (7 + Math.random() * 5) * SPRAY_SCALE * pressureScale;

  for (let index = 0; index < 64; index += 1) {
    const isOverspray = index >= 46;
    const localX = (Math.random() - 0.5) * (isOverspray ? 106 : 66) * SPRAY_SCALE * pressureScale;
    const localY = (Math.random() - 0.5) * (isOverspray ? 48 : 26) * SPRAY_SCALE * pressureScale;
    const cosine = Math.cos(direction);
    const sine = Math.sin(direction);

    particles.push({
      x: localX * cosine - localY * sine,
      y: localX * sine + localY * cosine,
      radius: (isOverspray ? 0.6 + Math.random() * 1.5 : 0.95 + Math.random() * 2.4) * SPRAY_SCALE * pressureScale,
      alpha: isOverspray ? 0.1 + Math.random() * 0.24 : 0.32 + Math.random() * 0.48,
    });
  }

  return {
    ...point,
    bodyHeight,
    bodyWidth,
    color,
    createdAt,
    direction,
    drip: Math.random() < 0.045
      ? {
          bend: (Math.random() - 0.5) * 1.5,
          offsetX: (Math.random() - 0.5) * bodyWidth,
          length: (30 + Math.random() * 48) * SPRAY_SCALE * pressureScale,
          width: (2 + Math.random() * 3) * SPRAY_SCALE * pressureScale,
        }
      : null,
    particles,
    tail: {
      length: (52 + Math.random() * 58) * SPRAY_SCALE * pressureScale,
      spread: (12 + Math.random() * 12) * SPRAY_SCALE * pressureScale,
      width: (3 + Math.random() * 4) * SPRAY_SCALE * pressureScale,
    },
  };
}

export function SprayCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stampsRef = useRef<SprayStamp[]>([]);
  const lastPointRef = useRef<Point | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const isSprayingRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const colorIndexRef = useRef(-1);
  const activeColorRef = useRef(SPRAY_COLORS[0]);

  useEffect(() => {
    const hero = document.getElementById("main-hero");
    const canvas = canvasRef.current;
    const supportsFinePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    );
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    if (!hero || !canvas || !supportsFinePointer.matches || prefersReducedMotion.matches) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const resizeCanvas = () => {
      const { height, width } = hero.getBoundingClientRect();
      const devicePixelRatio = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);

      canvas.width = Math.round(width * devicePixelRatio);
      canvas.height = Math.round(height * devicePixelRatio);
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };

    const render = (now: number) => {
      const { height, width } = hero.getBoundingClientRect();

      context.clearRect(0, 0, width, height);
      stampsRef.current = stampsRef.current.filter(
        (stamp) => now - stamp.createdAt < STAMP_DURATION,
      );

      for (const stamp of stampsRef.current) {
        const age = now - stamp.createdAt;
        const fade = age <= STAMP_VISIBLE_DURATION
          ? 1
          : (STAMP_DURATION - age) / (STAMP_DURATION - STAMP_VISIBLE_DURATION);

        const backwardX = Math.cos(stamp.direction + Math.PI);
        const backwardY = Math.sin(stamp.direction + Math.PI);

        context.strokeStyle = stamp.color;
        context.fillStyle = stamp.color;
        context.save();
        context.globalAlpha = 0.18 * fade;
        context.lineCap = "round";
        context.lineWidth = stamp.tail.width;
        context.beginPath();
        context.moveTo(stamp.x, stamp.y);
        context.quadraticCurveTo(
          stamp.x + backwardX * stamp.tail.length * 0.45 - backwardY * stamp.tail.spread,
          stamp.y + backwardY * stamp.tail.length * 0.45 + backwardX * stamp.tail.spread,
          stamp.x + backwardX * stamp.tail.length,
          stamp.y + backwardY * stamp.tail.length,
        );
        context.stroke();
        context.restore();

        context.save();
        context.translate(stamp.x, stamp.y);
        context.rotate(stamp.direction);
        context.globalAlpha = 0.24 * fade;
        context.beginPath();
        context.ellipse(0, 0, stamp.bodyWidth, stamp.bodyHeight, 0, 0, Math.PI * 2);
        context.fill();
        context.restore();

        for (const particle of stamp.particles) {
          context.globalAlpha = particle.alpha * fade;
          context.beginPath();
          context.arc(
            stamp.x + particle.x,
            stamp.y + particle.y,
            particle.radius,
            0,
            Math.PI * 2,
          );
          context.fill();
        }

        if (stamp.drip) {
          context.globalAlpha = 0.62 * fade;
          context.lineCap = "round";
          context.lineWidth = stamp.drip.width;
          context.beginPath();
          context.moveTo(stamp.x + stamp.drip.offsetX, stamp.y + stamp.bodyHeight * 0.5);
          context.lineTo(
            stamp.x + stamp.drip.offsetX + stamp.drip.bend,
            stamp.y + stamp.bodyHeight * 0.5 + stamp.drip.length,
          );
          context.stroke();
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

    const pressureScaleFromEvent = (event: PointerEvent) => {
      const pressure = event.pointerType === "pen" && event.pressure > 0
        ? event.pressure
        : 0.65;

      return MIN_PRESSURE_SCALE + (MAX_PRESSURE_SCALE - MIN_PRESSURE_SCALE) * pressure;
    };

    const addStamp = (point: Point, direction: number, pressureScale: number) => {
      stampsRef.current.push(
        createStamp(point, performance.now(), direction, pressureScale, activeColorRef.current),
      );

      if (stampsRef.current.length > MAX_STAMPS) {
        stampsRef.current.splice(0, stampsRef.current.length - MAX_STAMPS);
      }

      startRendering();
    };

    const pointFromEvent = (event: PointerEvent): Point => {
      const bounds = hero.getBoundingClientRect();

      return {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      };
    };

    const sprayAlongPath = (nextPoint: Point, pressureScale: number) => {
      const previousPoint = lastPointRef.current;

      if (!previousPoint) {
        addStamp(nextPoint, 0, pressureScale);
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
          pressureScale,
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

      if (hero.hasPointerCapture(event.pointerId)) {
        hero.releasePointerCapture(event.pointerId);
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
      hero.setPointerCapture(event.pointerId);
      const point = pointFromEvent(event);
      lastPointRef.current = point;
      addStamp(point, 0, pressureScaleFromEvent(event));
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!isSprayingRef.current || event.pointerId !== activePointerIdRef.current) {
        return;
      }

      sprayAlongPath(pointFromEvent(event), pressureScaleFromEvent(event));
    };

    resizeCanvas();

    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(hero);
    hero.addEventListener("pointerdown", handlePointerDown);
    hero.addEventListener("pointermove", handlePointerMove);
    hero.addEventListener("pointerup", stopSpraying);
    hero.addEventListener("pointercancel", stopSpraying);

    return () => {
      resizeObserver.disconnect();
      hero.removeEventListener("pointerdown", handlePointerDown);
      hero.removeEventListener("pointermove", handlePointerMove);
      hero.removeEventListener("pointerup", stopSpraying);
      hero.removeEventListener("pointercancel", stopSpraying);

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return <canvas className="pointer-events-none absolute inset-0 z-10 size-full" ref={canvasRef} aria-hidden="true" />;
}
