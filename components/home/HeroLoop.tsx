"use client";

import { useEffect, useRef } from "react";

/** Silent background loop behind the homepage hero. Swaps to the 9:16 files on tall screens; poster only for reduced motion or Save-Data. */
export function HeroLoop() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      v.removeAttribute("autoplay");
      v.pause();
      return;
    }
    if (window.matchMedia("(max-aspect-ratio: 3/4)").matches) {
      v.poster = "/video/hero-loop-poster-9x16.webp";
      v.querySelectorAll("source").forEach((s) => {
        s.src = (s.getAttribute("src") ?? "").replace("16x9", "9x16");
      });
      v.load();
      void v.play().catch(() => {});
    }
  }, []);

  return (
    <video
      ref={ref}
      className="home-hero-bg"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      aria-hidden="true"
      tabIndex={-1}
      disablePictureInPicture
      poster="/video/hero-loop-poster.webp"
    >
      <source src="/video/hero-loop-16x9.av1.mp4" type='video/mp4; codecs="av01.0.05M.08"' />
      <source src="/video/hero-loop-16x9.mp4" type="video/mp4" />
    </video>
  );
}
