"use client";

import { trackClientFunnelEvent } from "@/components/analytics/AnalyticsCapture";
import {
  DEEP_DIVE_CHECKOUT_URL,
  DEEP_DIVE_CTA_LABEL,
  DEEP_DIVE_FULFILLMENT,
  DEEP_DIVE_LEAD_COPY,
  DEEP_DIVE_OFFER_SLUG,
} from "@/lib/deep-dive";

export function DeepDiveCta({
  placement,
  className = "",
}: {
  placement: string;
  className?: string;
}) {
  return (
    <div
      className={`flex w-full max-w-md flex-col items-center gap-3 ${className}`}
    >
      <a
        href={DEEP_DIVE_CHECKOUT_URL}
        className="accent-button large-button w-full text-center sm:w-auto"
        onClick={() => {
          trackClientFunnelEvent("offer_cta_clicked", {
            offerSlug: DEEP_DIVE_OFFER_SLUG,
            placement,
          });
        }}
      >
        {DEEP_DIVE_CTA_LABEL}
      </a>
      <p className="text-center text-sm leading-relaxed text-brand-ink">
        {DEEP_DIVE_LEAD_COPY}
      </p>
      <p className="text-center text-xs leading-relaxed text-brand-ink-soft">
        {DEEP_DIVE_FULFILLMENT}
      </p>
    </div>
  );
}
