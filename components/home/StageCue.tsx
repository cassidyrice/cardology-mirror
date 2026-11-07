"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { setStage } from "./Stage";

/**
 * Tells the stage which product shot to show: the offer row nearest the middle
 * of the screen wins. Rows opt in with data-stage-src and data-stage-alt.
 * Leaving the block hands the stage back to the film.
 */
export function StageCue({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || !("IntersectionObserver" in window)) return;
    const rows = Array.from(root.querySelectorAll<HTMLElement>("[data-stage-src]"));
    if (rows.length === 0) return;
    const visible = new Set<HTMLElement>();
    let current: string | null = null;
    let frame = 0;

    const choose = () => {
      frame = 0;
      const middle = window.innerHeight / 2;
      let best: HTMLElement | null = null;
      let bestDistance = Infinity;
      for (const row of visible) {
        const r = row.getBoundingClientRect();
        const d = Math.abs((r.top + r.bottom) / 2 - middle);
        if (d < bestDistance) {
          bestDistance = d;
          best = row;
        }
      }
      const src = best?.dataset.stageSrc ?? null;
      if (src === current) return;
      current = src;
      if (best && src) setStage({ kind: "mockup", src, alt: best.dataset.stageAlt ?? "" });
      else setStage({ kind: "film" });
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(choose);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          if (entry.isIntersecting) visible.add(el);
          else visible.delete(el);
        }
        schedule();
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    rows.forEach((row) => io.observe(row));
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}
