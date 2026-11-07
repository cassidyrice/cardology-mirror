"use client";

import {
  createElement,
  useLayoutEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type ElementType,
} from "react";

/**
 * The one scroll primitive (docs/design/MOTION.md). Marks a section
 * `data-in-view="true"` once, when 15% of it is on screen, so its `[data-rise]`
 * parts settle into place in reading order. Everything is visible until the
 * page is marked `html[data-js]`, which happens here after the first check, so
 * nothing is ever hidden with scripting off and nothing flashes on hydration.
 */
type InViewProps<T extends ElementType> = {
  as?: T;
  once?: boolean;
} & ComponentPropsWithoutRef<T>;

function inViewport(el: Element): boolean {
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  return r.top < vh * 0.9 && r.bottom > 0;
}

export function InView<T extends ElementType = "section">({
  as,
  once = true,
  children,
  ...rest
}: InViewProps<T>) {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || inViewport(el)) {
      el.setAttribute("data-in-view", "true");
    }
    document.documentElement.setAttribute("data-js", "");
    if (reduce || !("IntersectionObserver" in window)) {
      el.setAttribute("data-in-view", "true");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.setAttribute("data-in-view", "true");
            if (once) io.disconnect();
          } else if (!once) {
            el.setAttribute("data-in-view", "false");
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once]);

  return createElement(
    as ?? "section",
    { ref, "data-in-view": "false", ...rest },
    children,
  );
}
