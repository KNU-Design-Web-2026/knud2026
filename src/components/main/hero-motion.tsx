"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export function HeroMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const sync = () => {
      node.dataset.running = String(visible && !document.hidden && !preference.matches);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(node);
    document.addEventListener("visibilitychange", sync);
    preference.addEventListener("change", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      preference.removeEventListener("change", sync);
    };
  }, []);

  return (
    <div className="hero-motion" data-paused={paused} ref={root}>
      {children}
      <button
        aria-label={paused ? "히어로 애니메이션 재생" : "히어로 애니메이션 일시정지"}
        aria-pressed={paused}
        className="hero-motion-toggle"
        onClick={() => setPaused((value) => !value)}
        type="button"
      >
        {paused ? "모션 재생" : "모션 멈춤"}
      </button>
    </div>
  );
}
