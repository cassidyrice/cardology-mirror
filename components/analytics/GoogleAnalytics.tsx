"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import {
  sanitizeGaEventParams,
  sanitizeGaPageLocation,
  type GaEventParams,
} from "@/lib/ga4";

declare global {
  interface Window {
    gtag?: (command: string, name: string, params?: GaEventParams) => void;
  }
}

export function GaPageViews() {
  const pathname = usePathname();
  const lastPage = useRef("");

  useEffect(() => {
    const sendPageView = () => {
      if (typeof window.gtag !== "function") return false;

      const page = sanitizeGaPageLocation(
        window.location.pathname + window.location.search,
      );
      if (!page || page === lastPage.current) return false;

      lastPage.current = page;
      window.gtag("event", "page_view", {
        page_path: page,
        page_location: `${window.location.origin}${page}`,
        page_title: document.title,
      });
      return true;
    };

    if (sendPageView()) return;

    const interval = window.setInterval(() => {
      if (sendPageView()) window.clearInterval(interval);
    }, 50);
    const timeout = window.setTimeout(() => window.clearInterval(interval), 3000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [pathname]);

  return null;
}

export function sendGaEvent(name: string, params: GaEventParams = {}) {
  if (typeof window.gtag === "function") {
    window.gtag("event", name, sanitizeGaEventParams(params));
  }
}
