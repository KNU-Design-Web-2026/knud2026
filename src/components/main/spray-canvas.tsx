"use client";

import { useEffect, useRef } from "react";
import { mountSprayCanvas } from "./spray-controller";

export function SprayCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const hero = document.getElementById("main-hero");
    const sprayZone = document.getElementById("main-spray-zone");
    const canvas = canvasRef.current;
    if (!hero || !sprayZone || !canvas) return;
    return mountSprayCanvas(hero, sprayZone, canvas);
  }, []);

  return <canvas className="pointer-events-none absolute inset-0 z-10 size-full" ref={canvasRef} aria-hidden="true" />;
}
