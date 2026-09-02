"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

// 일반 화면의 흰 화살표 위치를 조정한다. 양수는 오른쪽·아래 방향이다.
const SITE_CURSOR_OFFSET = { x: 30, y: 40 } as const;

export function SiteCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supportsFinePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine) and (min-width: 600.0625px)",
    );

    const root = document.documentElement;

    const moveCursor = (event: PointerEvent) => {
      if (!supportsFinePointer.matches) {
        return;
      }

      const cursor = cursorRef.current;

      if (!cursor) {
        return;
      }

      const isInsideSprayZone = (event.target as Element | null)?.closest(
        "#main-spray-zone",
      );

      cursor.style.opacity = isInsideSprayZone ? "0" : "1";
      cursor.style.transform = `translate3d(${event.clientX + SITE_CURSOR_OFFSET.x}px, ${event.clientY + SITE_CURSOR_OFFSET.y}px, 0) translate(-50%, -50%)`;
    };

    const hideCursor = () => {
      if (cursorRef.current) {
        cursorRef.current.style.opacity = "0";
      }
    };

    const syncCursorMode = () => {
      root.classList.toggle("has-custom-cursor", supportsFinePointer.matches);

      if (!supportsFinePointer.matches) {
        hideCursor();
      }
    };

    syncCursorMode();
    window.addEventListener("pointermove", moveCursor);
    document.addEventListener("pointerleave", hideCursor);
    supportsFinePointer.addEventListener("change", syncCursorMode);

    return () => {
      root.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", moveCursor);
      document.removeEventListener("pointerleave", hideCursor);
      supportsFinePointer.removeEventListener("change", syncCursorMode);
    };
  }, []);

  return (
    <div
      className="site-cursor fixed top-0 left-0 z-[100] h-[40.33px] w-[34px] -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-0"
      ref={cursorRef}
      aria-hidden="true"
    >
      <Image
        alt=""
        fill
        priority
        sizes="116px"
        src="/assets/figma/cursor-default.png"
      />
    </div>
  );
}
