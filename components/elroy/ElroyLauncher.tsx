"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  isElroyEligiblePath,
  parseElroyBirthContext,
  readElroySuppression,
  shouldScheduleElroyTeaser,
  writeElroySuppression,
} from "@/lib/elroy/widget";
import { trackClientFunnelEventOnce } from "@/components/analytics/AnalyticsCapture";
import "./elroy-widget.css";

const ElroyChatPanel = dynamic(
  () => import("./ElroyChatPanel").then((m) => m.ElroyChatPanel),
  { ssr: false },
);

const TEASER_MS = 10_000;

export function ElroyLauncher() {
  const pathname = usePathname() || "/";
  const [ready, setReady] = useState(false);
  const [suppressed, setSuppressed] = useState(true);
  const [isSmallScreen, setIsSmallScreen] = useState(true);
  const [teaser, setTeaser] = useState(false);
  const [open, setOpen] = useState(false);
  const [prefBirthdate, setPrefBirthdate] = useState("");
  const launcherRef = useRef<HTMLButtonElement | null>(null);
  const teaserEligibleRef = useRef(true);

  useEffect(() => {
    setReady(true);
    setSuppressed(readElroySuppression(window.localStorage, Date.now()));
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 640px)");
    const updateSmallScreen = () => setIsSmallScreen(mediaQuery.matches);
    updateSmallScreen();
    mediaQuery.addEventListener("change", updateSmallScreen);
    return () => mediaQuery.removeEventListener("change", updateSmallScreen);
  }, []);

  useEffect(() => {
    const initialBirthdate = parseElroyBirthContext({
      birthdate: window.__cardBlueprintsElroyBirthdate,
    });
    if (initialBirthdate) setPrefBirthdate(initialBirthdate);

    function onBirth(event: Event) {
      const detail = (event as CustomEvent).detail;
      const birthdate = parseElroyBirthContext(detail);
      if (birthdate) setPrefBirthdate(birthdate);
    }
    window.addEventListener("elroy:birth-card-revealed", onBirth);
    return () => window.removeEventListener("elroy:birth-card-revealed", onBirth);
  }, []);

  const eligible = ready && isElroyEligiblePath(pathname) && !suppressed;

  useEffect(() => {
    if (
      !eligible ||
      open ||
      !teaserEligibleRef.current ||
      !shouldScheduleElroyTeaser(pathname, isSmallScreen)
    ) {
      setTeaser(false);
      return;
    }
    const id = window.setTimeout(() => {
      teaserEligibleRef.current = false;
      setTeaser(true);
      trackClientFunnelEventOnce("elroy_teaser_shown", { placement: pathname });
    }, TEASER_MS);
    return () => window.clearTimeout(id);
  }, [eligible, isSmallScreen, open, pathname]);

  if (!eligible) return null;

  function suppress() {
    writeElroySuppression(window.localStorage, Date.now());
    setSuppressed(true);
    setTeaser(false);
    setOpen(false);
  }

  function closePanel() {
    const shouldSuppress = readElroySuppression(window.localStorage, Date.now());
    setOpen(false);
    setSuppressed(shouldSuppress);
    if (!shouldSuppress) {
      window.requestAnimationFrame(() => launcherRef.current?.focus());
    }
  }

  return (
    <div className="elroy-root">
      {teaser && !open ? (
        <div className="elroy-teaser" role="status">
          <p>Want the pattern behind your birth card?</p>
          <button
            type="button"
            className="elroy-teaser-close"
            aria-label="Dismiss Elroy teaser"
            onClick={suppress}
          >
            ×
          </button>
        </div>
      ) : null}

      <button
        ref={launcherRef}
        type="button"
        className="elroy-launcher"
        aria-label="Open Elroy micro-reading"
        onClick={() => {
          teaserEligibleRef.current = false;
          setOpen(true);
          setTeaser(false);
        }}
      >
        <img src="/brand/elroy-avatar.svg" alt="" width={40} height={40} />
      </button>

      {open ? (
        <ElroyChatPanel
          open={open}
          prefBirthdate={prefBirthdate}
          placement={pathname}
          onClose={closePanel}
          onComplete={() => {
            writeElroySuppression(window.localStorage, Date.now());
          }}
        />
      ) : null}
    </div>
  );
}
