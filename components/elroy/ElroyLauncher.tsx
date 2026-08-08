"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  isElroyEligiblePath,
  parseElroyBirthContext,
  readElroySuppression,
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
  const [teaser, setTeaser] = useState(false);
  const [open, setOpen] = useState(false);
  const [prefBirthdate, setPrefBirthdate] = useState("");

  useEffect(() => {
    setReady(true);
    setSuppressed(readElroySuppression(window.localStorage, Date.now()));
  }, []);

  useEffect(() => {
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
    if (!eligible || open) {
      setTeaser(false);
      return;
    }
    const id = window.setTimeout(() => {
      setTeaser(true);
      trackClientFunnelEventOnce("elroy_teaser_shown", { placement: pathname });
    }, TEASER_MS);
    return () => window.clearTimeout(id);
  }, [eligible, open, pathname]);

  if (!eligible) return null;

  function suppress() {
    writeElroySuppression(window.localStorage, Date.now());
    setSuppressed(true);
    setTeaser(false);
    setOpen(false);
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
        type="button"
        className="elroy-launcher"
        aria-label="Open Elroy micro-reading"
        onClick={() => {
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
          onClose={() => setOpen(false)}
          onComplete={() => {
            writeElroySuppression(window.localStorage, Date.now());
          }}
        />
      ) : null}
    </div>
  );
}
