"use client";

import { useEffect } from "react";

import { trackClientFunnelEventOnce } from "@/components/analytics/AnalyticsCapture";

/** Fires deep_dive_delivered once when download links render on checkout success. */
export function DeepDiveDeliveredBeacon({ placement }: { placement: string }) {
  useEffect(() => {
    trackClientFunnelEventOnce("deep_dive_delivered", { placement });
  }, [placement]);

  return null;
}
