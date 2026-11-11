"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { CardBack } from "@/components/cards/CardBack";

/**
 * One-Page 3D Spatial Deck Stage.
 * - `film`: Ambient film + interactive 3D stacked deck floating in perspective space.
 * - `card`: Lifts the top card in Z-space and turns 180° to reveal your birth card
 *           with your Planetary Ruling Card angled in depth behind it.
 * - `pair`: Two 3D cards angled toward each other in spatial perspective when comparing two birthdays.
 * - `mockup`: Offer plate preview while scrolling the readings menu.
 */
export type StagePicture =
  | { kind: "film" }
  | {
      kind: "card";
      face: string | null;
      label: string;
      rulingFace?: string | null;
      rulingLabel?: string | null;
    }
  | {
      kind: "pair";
      cardA: { face: string | null; label: string };
      cardB: { face: string | null; label: string };
    }
  | { kind: "mockup"; src: string; alt: string };

export const STAGE_EVENT = "cb:stage";

export function setStage(picture: StagePicture) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<StagePicture>(STAGE_EVENT, { detail: picture }));
}

export function Stage() {
  const [picture, setPicture] = useState<StagePicture>({ kind: "film" });
  const [turn, setTurn] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number>(0);
  const reducedMotionRef = useRef<boolean>(false);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const onStage = (event: Event) => {
      const next = (event as CustomEvent<StagePicture>).detail;
      if (!next) return;
      setPicture(next);
      if (next.kind === "card" || next.kind === "pair") setTurn((n) => n + 1);
    };
    window.addEventListener(STAGE_EVENT, onStage);
    return () => {
      window.removeEventListener(STAGE_EVENT, onStage);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
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

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (reducedMotionRef.current || event.pointerType === "touch") return;
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const nx = (event.clientX - rect.left) / rect.width - 0.5;
    const ny = (event.clientY - rect.top) / rect.height - 0.5;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      el.style.setProperty("--stage-ry", `${(nx * 14).toFixed(2)}deg`);
      el.style.setProperty("--stage-rx", `${(-ny * 11).toFixed(2)}deg`);
      el.style.setProperty("--stage-sheen-x", `${((nx + 0.5) * 100).toFixed(1)}%`);
      el.style.setProperty("--stage-sheen-y", `${((ny + 0.5) * 100).toFixed(1)}%`);
    });
  }

  function handlePointerLeave() {
    const el = stageRef.current;
    if (!el) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    el.style.setProperty("--stage-ry", "0deg");
    el.style.setProperty("--stage-rx", "0deg");
    el.style.setProperty("--stage-sheen-x", "50%");
    el.style.setProperty("--stage-sheen-y", "35%");
  }

  const card = picture.kind === "card" ? picture : null;
  const pair = picture.kind === "pair" ? picture : null;
  const mockup = picture.kind === "mockup" ? picture : null;
  const deckIdle = picture.kind === "film";

  return (
    <div
      ref={stageRef}
      className="stage"
      data-picture={picture.kind}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
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

      {/* Idle 3D Spatial Deck Stack */}
      <div className="stage-deck" data-shown={deckIdle ? "true" : "false"} aria-hidden="true">
        <div className="stage-3d-rig">
          <div className="stage-deck-layer stage-deck-layer-3">
            <CardBack />
          </div>
          <div className="stage-deck-layer stage-deck-layer-2">
            <CardBack />
          </div>
          <div className="stage-deck-layer stage-deck-layer-1">
            <CardBack />
            <span className="stage-card-sheen" />
          </div>
        </div>
        <p className="stage-spatial-caption">52 cards · fixed by birth date</p>
      </div>

      {/* Solo 3D Revealed Card (+ Ruling Card in Z-depth) */}
      <div className="stage-card" data-shown={card ? "true" : "false"} aria-live="off">
        {card ? (
          <div className="stage-3d-rig" key={`${card.label}-${turn}`}>
            {card.rulingFace && card.rulingFace !== card.face ? (
              <div className="stage-ruling-shadow-card" aria-hidden="true">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.rulingFace}
                  alt=""
                  width={600}
                  height={900}
                  decoding="async"
                />
              </div>
            ) : null}
            <div className="flip-scene stage-card-scene">
              <div className="flip-inner stage-card-inner">
                <div className="flip-face stage-card-face-wrap">
                  {card.face ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={card.face}
                        alt={`${card.label} playing card`}
                        width={1000}
                        height={1500}
                        decoding="async"
                        className="stage-card-face"
                      />
                      <span className="stage-card-sheen" aria-hidden="true" />
                    </>
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
          </div>
        ) : null}
      </div>

      {/* Two-Card 3D Spatial Pair */}
      <div className="stage-pair" data-shown={pair ? "true" : "false"} aria-live="off">
        {pair ? (
          <div className="stage-3d-rig stage-pair-rig" key={`${pair.cardA.label}-${pair.cardB.label}-${turn}`}>
            <div className="stage-pair-slot stage-pair-left">
              {pair.cardA.face ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={pair.cardA.face}
                  alt={`${pair.cardA.label} playing card`}
                  width={800}
                  height={1200}
                  decoding="async"
                  className="stage-card-face"
                />
              ) : (
                <div className="stage-card-face stage-card-joker">Joker</div>
              )}
              <span className="stage-card-sheen" aria-hidden="true" />
            </div>
            <div className="stage-pair-slot stage-pair-right">
              {pair.cardB.face ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={pair.cardB.face}
                  alt={`${pair.cardB.label} playing card`}
                  width={800}
                  height={1200}
                  decoding="async"
                  className="stage-card-face"
                />
              ) : (
                <div className="stage-card-face stage-card-joker">Joker</div>
              )}
              <span className="stage-card-sheen" aria-hidden="true" />
            </div>
          </div>
        ) : null}
      </div>

      <div className="stage-mockup" data-shown={mockup ? "true" : "false"}>
        {mockup ? (
          /* eslint-disable-next-line @next/next/no-img-element */
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
