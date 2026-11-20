"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function ExhibitionArchiveReveal({ children, className }: { children: ReactNode; className: string }) {
  const galleryRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery || !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          (entry.target as HTMLElement).dataset.archiveVisible = String(entry.isIntersecting);
        }
      },
      { rootMargin: "0px 0px -8%", threshold: 0.12 },
    );

    gallery.dataset.archiveMotionReady = "true";
    for (const card of gallery.children) observer.observe(card);

    return () => {
      observer.disconnect();
      delete gallery.dataset.archiveMotionReady;
    };
  }, []);

  return <ul ref={galleryRef} className={className}>{children}</ul>;
}
