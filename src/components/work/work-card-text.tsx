"use client";

import { useLayoutEffect, useRef } from "react";

/** Fit only overflowing text; keep the card's original font size and line box. */
export function WorkCardText({ children }: { children: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const text = ref.current;
    const box = text?.parentElement;
    if (!text || !box) return;
    let disposed = false;
    let frame = 0;

    function fit() {
      if (disposed || !text || !box || box.clientWidth === 0) return;
      const base = Number.parseFloat(getComputedStyle(box).fontSize);
      text.style.fontSize = `${base}px`;
      const naturalWidth = text.getBoundingClientRect().width;
      if (naturalWidth > box.clientWidth) {
        // A small safety margin accounts for fractional glyph widths.
        text.style.fontSize = `${base * (box.clientWidth - 1) / naturalWidth}px`;
      }
      text.dataset.fitReady = "true";
    }

    function schedule() {
      if (disposed) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    }

    fit();
    const observer = new ResizeObserver(schedule);
    observer.observe(box);
    // Fonts can change glyph widths without changing the available card width.
    void document.fonts.ready.then(schedule);
    document.fonts.addEventListener("loadingdone", schedule);
    window.addEventListener("resize", schedule);
    return () => {
      disposed = true;
      observer.disconnect();
      cancelAnimationFrame(frame);
      document.fonts.removeEventListener("loadingdone", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [children]);

  return <span className="work-card__fit-text" ref={ref}>{children}</span>;
}
