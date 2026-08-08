import Script from "next/script";

import { buildGtagBootstrapSnippet } from "@/lib/ga4";
import { GaPageViews } from "@/components/analytics/GoogleAnalytics";

export function GoogleAnalyticsBoundary({
  measurementId,
}: {
  measurementId: string;
}) {
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
