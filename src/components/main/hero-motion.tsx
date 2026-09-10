"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function HeroMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

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
    <div className="hero-motion" ref={root}>{children}</div>
  );
}
