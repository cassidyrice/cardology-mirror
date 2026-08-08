"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

type Props = {
  onToken: (token: string) => void;
  resetSignal: number;
};

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

export function ElroyTurnstile({ onToken, resetSignal }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  useEffect(() => {
    if (!SITE_KEY) {
      onTokenRef.current("");
      return;
    }
    if (!hostRef.current) return;

    let cancelled = false;

    function mount() {
      if (cancelled || !hostRef.current || !window.turnstile) return;
      if (widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
      hostRef.current.innerHTML = "";
      widgetIdRef.current = window.turnstile.render(hostRef.current, {
        sitekey: SITE_KEY,
        action: "elroy_micro_reading",
        appearance: "interaction-only",
        theme: "light",
        size: "flexible",
        callback: (token) => onTokenRef.current(token),
        "error-callback": () => onTokenRef.current(""),
        "expired-callback": () => onTokenRef.current(""),
      });
    }

    if (window.turnstile) {
      mount();
    } else {
      const id = window.setInterval(() => {
        if (window.turnstile) {
          window.clearInterval(id);
          mount();
        }
      }, 50);
      const timeout = window.setTimeout(() => window.clearInterval(id), 8000);
      return () => {
        cancelled = true;
        window.clearInterval(id);
        window.clearTimeout(timeout);
      };
    }

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!SITE_KEY) {
      onTokenRef.current("");
      return;
    }
    if (!widgetIdRef.current || !window.turnstile) return;
    window.turnstile.reset(widgetIdRef.current);
    onTokenRef.current("");
  }, [resetSignal]);

  if (!SITE_KEY) {
    return (
      <p className="elroy-error" role="status">
        Verification is unavailable right now. Please try again later.
      </p>
    );
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
      />
      <div ref={hostRef} data-elroy-turnstile="" />
    </>
  );
}

export function elroyTurnstileSiteKeyConfigured(): boolean {
  return Boolean(SITE_KEY);
}
