"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { trackClientFunnelEvent } from "@/components/analytics/AnalyticsCapture";
import { storeCheckoutBirthdate } from "@/lib/checkout-birthdate";
import { storeCheckoutContext } from "@/lib/checkout-question";
import {
  DEEP_DIVE_OFFER_SLUG,
  DEEP_DIVE_PRICE_LABEL,
  DEEP_DIVE_REVIEW_PATH,
} from "@/lib/deep-dive";

/**
 * Entry to the One Question Reading. The birth date is kept in this tab
 * (sessionStorage, never a URL) and the buyer types the question on the review
 * page (DEEP_DIVE_REVIEW_PATH) before Stripe. The session route requires both.
 */
export function DeepDiveHostedCheckout({
  birthdate,
  source,
  cardLabel,
  cardSlug,
  compact = false,
  submitLabel,
}: {
  birthdate: string;
  source: string;
  cardLabel?: string;
  cardSlug?: string;
  compact?: boolean;
  submitLabel?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  function onClick() {
    if (pending) return;
    setPending(true);
    trackClientFunnelEvent("offer_cta_clicked", {
      offerSlug: DEEP_DIVE_OFFER_SLUG,
      placement: source,
    });
    storeCheckoutBirthdate(birthdate);
    storeCheckoutContext({ source, cardLabel, cardSlug });
    router.push(DEEP_DIVE_REVIEW_PATH);
  }

  return (
    <div className={compact ? "" : "w-full"} data-analytics-checkout>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-busy={pending}
        className={
          compact
            ? "paper-button small-button text-center disabled:cursor-wait disabled:opacity-70"
            : "accent-button large-button w-full text-center disabled:cursor-wait disabled:opacity-70"
        }
      >
        {pending
          ? "Opening your question…"
          : submitLabel || `Ask your question — ${DEEP_DIVE_PRICE_LABEL}`}
      </button>
    </div>
  );
}
