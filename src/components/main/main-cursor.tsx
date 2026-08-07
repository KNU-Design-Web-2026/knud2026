"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

export function MainCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hero = document.getElementById("main-hero");
    const supportsFinePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    );

    if (!hero || !supportsFinePointer.matches) {
      return;
    }

    const moveCursor = (event: PointerEvent) => {
      const cursor = cursorRef.current;

      if (!cursor) {
        return;
      }

      cursor.style.opacity = "1";
      cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%)`;
    };

    const hideCursor = () => {
      if (cursorRef.current) {
        cursorRef.current.style.opacity = "0";
      }
    };

    hero.addEventListener("pointermove", moveCursor);
    hero.addEventListener("pointerleave", hideCursor);

    return () => {
      hero.removeEventListener("pointermove", moveCursor);
      hero.removeEventListener("pointerleave", hideCursor);
    };
  }, []);

  return (
    <div
      className="main-cursor fixed top-0 left-0 z-20 h-[clamp(7.5rem,10vw,11.56rem)] w-[clamp(5.014rem,6.68vw,7.728rem)] -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-0"
      ref={cursorRef}
      aria-hidden="true"
    >
      <Image
        alt=""
        fill
        priority
        sizes="221.82px"
        src="/assets/figma/main-cursor-figure.svg"
      />
    </div>
  );
}
