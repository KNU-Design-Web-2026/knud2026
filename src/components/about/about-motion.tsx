"use client";

import { useEffect } from "react";
import { advanceMotion, revealProgress } from "./about-motion-math";

export function AboutMotion() {
  useEffect(() => {
    const page = document.querySelector<HTMLElement>("[data-about-page]");
    if (!page) return;
    const elements = Array.from(page.querySelectorAll<HTMLElement>("[data-about-reveal]"));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const states = elements.map((element) => ({ element, value: 0, velocity: 0, target: 0 }));
    const depths = Array.from(page.querySelectorAll<HTMLElement>("[data-about-depth]"))
      .map((element) => ({ element, value: 0, velocity: 0, target: 0 }));
    let frame: number | null = null;
    let previousTime = 0;
    let dirty = true;

    function update(time: number) {
      frame = null;
      const seconds = previousTime ? Math.min((time - previousTime) / 1000, 0.064) : 1 / 60;
      previousTime = time;

      if (dirty) {
        // Read layout before writing styles; exclude our animated translation.
        states.forEach((state) => {
          const rect = state.element.getBoundingClientRect();
          state.target = reducedMotion.matches || state.element.dataset.aboutReveal === "scale"
            ? 1
            : rect.width > 0
              ? revealProgress(rect.top - 140 * (1 - Math.max(0, Math.min(1, state.value))), state.element.offsetHeight, window.innerHeight)
              : 0;
        });
        depths.forEach((depth) => {
          // Use layout coordinates so scale/translation cannot move the trigger.
          let top = 0;
          let node: HTMLElement | null = depth.element;
          while (node) {
            top += node.offsetTop;
            node = node.offsetParent as HTMLElement | null;
          }
          depth.target = reducedMotion.matches || !depth.element.offsetHeight ? 0
            : Math.max(0, Math.min(1, (window.scrollY - top) / depth.element.offsetHeight));
        });
        dirty = false;
      }

      let moving = false;
      for (const state of [...states, ...depths]) {
        const next = reducedMotion.matches
          ? { value: state.target, velocity: 0 }
          : advanceMotion(state.value, state.velocity, state.target, seconds);
        state.value = next.value;
        state.velocity = next.velocity;
        if (Math.abs(state.target - state.value) < 0.0001 && Math.abs(state.velocity) < 0.001) {
          state.value = state.target;
          state.velocity = 0;
        } else {
          moving = true;
        }
      }

      states.forEach(({ element, value, target }) => {
        element.style.setProperty("--about-progress", String(Math.max(0, Math.min(1, value))));
        element.toggleAttribute("data-about-revealed", target > 0);
      });
      depths.forEach(({ element, value }) => {
        const progress = Math.max(0, Math.min(1, value));
        element.style.setProperty("--about-depth-scale", String(1 - 0.4 * progress));
        element.style.setProperty("--about-depth-blur", `${15 * progress}px`);
      });
      if (moving) frame = window.requestAnimationFrame(update);
      else previousTime = 0;
    }

    function scheduleUpdate() {
      dirty = true;
      if (frame === null) frame = window.requestAnimationFrame(update);
    }

    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    reducedMotion.addEventListener("change", scheduleUpdate);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      reducedMotion.removeEventListener("change", scheduleUpdate);
      if (frame !== null) window.cancelAnimationFrame(frame);
      elements.forEach((element) => {
        element.style.removeProperty("--about-progress");
        element.removeAttribute("data-about-revealed");
      });
      depths.forEach(({ element }) => {
        element.style.removeProperty("--about-depth-scale");
        element.style.removeProperty("--about-depth-blur");
      });
    };
  }, []);

  return null;
}
