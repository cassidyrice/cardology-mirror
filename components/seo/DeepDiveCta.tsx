"use client";

import { useState } from "react";

import { trackClientFunnelEvent } from "@/components/analytics/AnalyticsCapture";
import { DeepDiveEmbeddedCheckout } from "@/components/checkout/DeepDiveEmbeddedCheckout";
import { sanitizeBirthdateISO } from "@/lib/birthdate";
import {
  DEEP_DIVE_CTA_LABEL,
  DEEP_DIVE_FULFILLMENT,
  DEEP_DIVE_OFFER_SLUG,
  sanitizeDeepDiveSource,
} from "@/lib/deep-dive";

export function DeepDiveCta({
  placement,
  birthdate,
  source = "birth-card-calculator",
  className = "",
}: {
  placement: string;
  birthdate?: string;
  source?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const iso = sanitizeBirthdateISO(birthdate);

  return (
    <div
      className={`flex w-full max-w-md flex-col items-center gap-3 ${className}`}
    >
      {open && iso ? (
        <DeepDiveEmbeddedCheckout
          birthdate={iso}
          source={sanitizeDeepDiveSource(source)}
        />
      ) : (
        <button
          type="button"
          className="accent-button large-button w-full text-center sm:w-auto"
          disabled={!iso}
          onClick={() => {
            trackClientFunnelEvent("offer_cta_clicked", {
              offerSlug: DEEP_DIVE_OFFER_SLUG,
              placement,
            });
            setOpen(true);
          }}
        >
          {DEEP_DIVE_CTA_LABEL}
        </button>
      )}
      <p className="text-center text-xs leading-relaxed text-brand-ink-soft">
        {DEEP_DIVE_FULFILLMENT}
      </p>
    </div>
  );
}
