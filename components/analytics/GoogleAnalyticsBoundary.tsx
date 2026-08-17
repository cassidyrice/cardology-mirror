"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

import { buildGtagBootstrapSnippet } from "@/lib/ga4";
import { GaPageViews } from "@/components/analytics/GoogleAnalytics";
import {
  CONSENT_EVENT,
  readPrivacyConsent,
  type PrivacyConsent,
} from "@/lib/consent";

export function GoogleAnalyticsBoundary({
  measurementId,
}: {
  measurementId: string;
}) {
  const [consent, setConsent] = useState<PrivacyConsent>("denied");

  useEffect(() => {
    setConsent(readPrivacyConsent());
    function onChange(event: Event) {
      const detail = (event as CustomEvent<PrivacyConsent>).detail;
      setConsent(detail === "granted" ? "granted" : readPrivacyConsent());
    }
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);

  if (consent !== "granted") return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-bootstrap" strategy="afterInteractive">
        {buildGtagBootstrapSnippet(measurementId)}
      </Script>
      <GaPageViews />
    </>
  );
}
