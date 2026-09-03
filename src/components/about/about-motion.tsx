"use client";

import { useEffect } from "react";

export function AboutMotion() {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-about-reveal]"));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reducedMotion.matches) {
      elements.forEach((element) => element.setAttribute("data-about-revealed", ""));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.setAttribute("data-about-revealed", "");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8%", threshold: 0.08 },
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  return null;
}
