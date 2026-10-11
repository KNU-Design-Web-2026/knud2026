"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

/** Apply one title size to every card, based on the tightest title fit. */
export function WorkGrid({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const grid = ref.current;
    if (!grid) return;
    const titles = [...grid.querySelectorAll<HTMLSpanElement>(".work-card__title > span")];
    let disposed = false;
    let frame = 0;

    function fitTitles() {
      if (disposed || !grid || grid.clientWidth === 0) return;
      // Reset all titles before measuring so widening restores the design size.
      for (const title of titles) title.style.removeProperty("font-size");
      const commonSize = Math.min(...titles.map((title) => {
        const box = title.parentElement;
        if (!box) return Infinity;
        const base = Number.parseFloat(getComputedStyle(box).fontSize);
        const width = title.getBoundingClientRect().width;
        return width > box.clientWidth ? base * (box.clientWidth - 1) / width : base;
      }));
      if (!Number.isFinite(commonSize)) return;
      for (const title of titles) {
        title.style.fontSize = `${commonSize}px`;
        title.dataset.fitReady = "true";
      }
    }

    function schedule() {
      if (disposed) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fitTitles);
    }

    fitTitles();
    const observer = new ResizeObserver(schedule);
    observer.observe(grid);
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

  return <div className="work-grid" ref={ref}>{children}</div>;
}
