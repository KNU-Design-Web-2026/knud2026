"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

// 스프레이 Hero 안의 기본·클릭 커서 위치를 각각 조정한다. 양수는 오른쪽·아래 방향이다.
const MAIN_CURSOR_OFFSET = {
  default: { x: 75, y: 75 },
  pressed: { x: 75, y: 75 },
} as const;

export function MainCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const isPressedRef = useRef(false);
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    const sprayZone = document.getElementById("main-spray-zone");
    const supportsFinePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    );

    if (!sprayZone || !supportsFinePointer.matches) {
      return;
    }

    const positionCursor = (event: PointerEvent, pressed: boolean) => {
      const cursor = cursorRef.current;

      if (!cursor) {
        return;
      }

      const offset = pressed
        ? MAIN_CURSOR_OFFSET.pressed
        : MAIN_CURSOR_OFFSET.default;

      cursor.style.transform = `translate3d(${event.clientX + offset.x}px, ${event.clientY + offset.y}px, 0) translate(-50%, -50%)`;
    };

    const moveCursor = (event: PointerEvent) => {
      if (!cursorRef.current) {
        return;
      }

      cursorRef.current.style.opacity = "1";
      positionCursor(event, isPressedRef.current);
    };

    const hideCursor = () => {
      if (cursorRef.current) {
        cursorRef.current.style.opacity = "0";
      }

      isPressedRef.current = false;
      setIsPressed(false);
    };

    const showPressedCursor = (event: PointerEvent) => {
      if (event.isPrimary) {
        isPressedRef.current = true;
        setIsPressed(true);
        positionCursor(event, true);
      }
    };

    const showDefaultCursor = (event: PointerEvent) => {
      isPressedRef.current = false;
      setIsPressed(false);
      positionCursor(event, false);
    };

    sprayZone.addEventListener("pointermove", moveCursor);
    sprayZone.addEventListener("pointerleave", hideCursor);
    sprayZone.addEventListener("pointerdown", showPressedCursor);
    window.addEventListener("pointerup", showDefaultCursor);
    window.addEventListener("pointercancel", showDefaultCursor);

    return () => {
      sprayZone.removeEventListener("pointermove", moveCursor);
      sprayZone.removeEventListener("pointerleave", hideCursor);
      sprayZone.removeEventListener("pointerdown", showPressedCursor);
      window.removeEventListener("pointerup", showDefaultCursor);
      window.removeEventListener("pointercancel", showDefaultCursor);
    };
  }, []);

  return (
    <div
      className="main-cursor fixed top-0 left-0 z-20 h-[6.841rem] w-[6.05rem] -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-0"
      ref={cursorRef}
      aria-hidden="true"
    >
      <Image
        alt=""
        fill
        priority
        sizes="120px"
        className="object-contain object-bottom"
        src={
          isPressed
            ? "/assets/figma/spray-cursor-pressed.png"
            : "/assets/figma/spray-cursor-default.png"
        }
      />
    </div>
  );
}
