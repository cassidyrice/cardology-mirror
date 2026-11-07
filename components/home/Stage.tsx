"use client";

import { useEffect, useRef, useState } from "react";
import { CardBack } from "@/components/cards/CardBack";

/**
 * The half of the screen that never moves (docs/design/DIRECTION.md). A flat
 * board holding one picture: the real deck face down on film, your card once
 * you have entered a birthday, or the product shot of the offer beside it.
 * Pictures change by a short crossfade and nothing else; the board stays.
 *
 * Anyone on the page can change the picture:
 *   window.dispatchEvent(new CustomEvent("cb:stage", { detail: { kind: "film" } }))
 *   { kind: "card", face: "/share-cards/faces/8-of-diamonds.png", label: "Eight of Diamonds" }
 *   { kind: "mockup", src: "/brand/mockups/timing-map-wide.webp", alt: "…" }
 */
export type StagePicture =
  | { kind: "film" }
  | { kind: "card"; face: string | null; label: string }
  | { kind: "mockup"; src: string; alt: string };

export const STAGE_EVENT = "cb:stage";

export function setStage(picture: StagePicture) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<StagePicture>(STAGE_EVENT, { detail: picture }));
}

export function Stage() {
  const [picture, setPicture] = useState<StagePicture>({ kind: "film" });
  const [turn, setTurn] = useState(0);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const onStage = (event: Event) => {
      const next = (event as CustomEvent<StagePicture>).detail;
      if (!next) return;
      setPicture(next);
      if (next.kind === "card") setTurn((n) => n + 1);
    };
    window.addEventListener(STAGE_EVENT, onStage);
    return () => window.removeEventListener(STAGE_EVENT, onStage);
  }, []);

  // Poster only under reduced motion or Save-Data; otherwise the loop plays muted.
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      v.removeAttribute("autoplay");
      v.pause();
      return;
    }
    // The poster is the first paint; the film starts once the page is idle.
    const start = () => {
      v.querySelectorAll("source").forEach((s) => {
        const src = s.getAttribute("data-src");
        if (src) s.setAttribute("src", src);
      });
      v.load();
      void v.play().catch(() => {});
    };
    const hasIdle = typeof window.requestIdleCallback === "function";
    const handle = hasIdle
      ? window.requestIdleCallback(start, { timeout: 2500 })
      : window.setTimeout(start, 1200);
    return () => {
      if (hasIdle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
    };
  }, []);

  const card = picture.kind === "card" ? picture : null;
  const mockup = picture.kind === "mockup" ? picture : null;

  return (
    <div className="stage" data-picture={picture.kind}>
      <video
        ref={video}
        className="stage-film"
        muted
        loop
        playsInline
        preload="none"
        aria-hidden="true"
        tabIndex={-1}
        disablePictureInPicture
        poster="/video/hero-loop-poster-9x16.webp"
        width={720}
        height={1280}
      >
        <source data-src="/video/hero-loop-9x16.av1.mp4" type='video/mp4; codecs="av01.0.05M.08"' />
        <source data-src="/video/hero-loop-9x16.mp4" type="video/mp4" />
      </video>

      <div className="stage-card" data-shown={card ? "true" : "false"} aria-live="off">
        {card ? (
          <div className="flip-scene stage-card-scene" key={`${card.label}-${turn}`}>
            <div className="flip-inner stage-card-inner">
              <div className="flip-face stage-card-face-wrap">
                {card.face ? (
                  <img
                    src={card.face}
                    alt={`${card.label} playing card`}
                    width={1000}
                    height={1500}
                    decoding="async"
                    className="stage-card-face"
                  />
                ) : (
                  <div className="stage-card-face stage-card-joker" role="img" aria-label="The Joker">
                    Joker
                  </div>
                )}
              </div>
              <div className="flip-face flip-back">
                <div className="stage-card-face hero-card-back">
                  <CardBack />
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="stage-mockup" data-shown={mockup ? "true" : "false"}>
        {mockup ? (
          <img
            key={mockup.src}
            src={mockup.src}
            alt={mockup.alt}
            width={1600}
            height={1000}
            loading="lazy"
            decoding="async"
          />
        ) : null}
      </div>
    </div>
  );
}
