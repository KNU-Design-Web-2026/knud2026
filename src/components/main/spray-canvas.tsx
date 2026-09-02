"use client";

import { useEffect, useRef } from "react";

const STAMP_SPACING = 12;
const STAMP_DURATION = 2_400;
const STAMP_VISIBLE_DURATION = 1_800;
const MAX_DEVICE_PIXEL_RATIO = 2;
const SPRAY_SCALE = 1.9;
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

type SprayEdgePoint = {
  x: number;
  y: number;
};

type SprayDrip = {
  bend: number;
  length: number;
  offsetX: number;
  tipRadius: number;
  width: number;
};

type SprayStamp = Point & {
  bodyHeight: number;
  bodyWidth: number;
  color: string;
  createdAt: number;
  direction: number;
  drip: SprayDrip | null;
  edgePoints: SprayEdgePoint[];
  particles: SprayParticle[];
};

function createStamp(
  point: Point,
  createdAt: number,
  direction: number,
  color: string,
): SprayStamp {
  const particles: SprayParticle[] = [];
  const bodyWidth = (32 + Math.random() * 18) * SPRAY_SCALE;
  const bodyHeight = (7 + Math.random() * 5) * SPRAY_SCALE;
  const edgePoints: SprayEdgePoint[] = Array.from({ length: 20 }, (_, index) => {
    const angle = (index / 20) * Math.PI * 2;
    const edgeJitter = 0.72 + Math.random() * 0.48;
    const tooth = index % 3 === 0 ? 1.14 : 1;

    return {
      x: Math.cos(angle) * bodyWidth * edgeJitter * tooth,
      y: Math.sin(angle) * bodyHeight * edgeJitter,
    };
  });

  for (let index = 0; index < 82; index += 1) {
    const isOverspray = index >= 52;
    const localX = (Math.random() - 0.5) * (isOverspray ? 118 : 72) * SPRAY_SCALE;
    const localY = (Math.random() - 0.5) * (isOverspray ? 56 : 30) * SPRAY_SCALE;
    const cosine = Math.cos(direction);
    const sine = Math.sin(direction);

    particles.push({
      x: localX * cosine - localY * sine,
      y: localX * sine + localY * cosine,
      radius: (isOverspray ? 0.35 + Math.random() * 1.35 : 0.7 + Math.random() * 2.8) * SPRAY_SCALE,
      alpha: isOverspray ? 0.08 + Math.random() * 0.3 : 0.28 + Math.random() * 0.58,
    });
  }

  return {
    ...point,
    bodyHeight,
    bodyWidth,
    color,
    createdAt,
    direction,
    drip: Math.random() < 0.075
      ? {
          bend: (Math.random() - 0.5) * 14 * SPRAY_SCALE,
          offsetX: (Math.random() - 0.5) * bodyWidth,
          length: (24 + Math.random() * 52) * SPRAY_SCALE,
          tipRadius: (1.5 + Math.random() * 3.5) * SPRAY_SCALE,
          width: (1.5 + Math.random() * 3.5) * SPRAY_SCALE,
        }
      : null,
    edgePoints,
    particles,
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
      stampsRef.current.push(
        createStamp(point, performance.now(), direction, activeColorRef.current),
      );

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
