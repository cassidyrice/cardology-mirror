"use client";

import Link from "next/link";
import { useRef, useState, type MouseEvent } from "react";

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
 *
 * The control is a real link to that review page, so it still navigates with
 * JavaScript off or before hydration. With JavaScript, the click stores the
 * date and context first; the link then client-navigates once.
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
  const pendingRef = useRef(false);
  const [pending, setPending] = useState(false);

  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    if (pendingRef.current) {
      event.preventDefault();
      return;
    }
    const modified =
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0;
    trackClientFunnelEvent("offer_cta_clicked", {
      offerSlug: DEEP_DIVE_OFFER_SLUG,
      placement: source,
    });
    storeCheckoutBirthdate(birthdate);
    storeCheckoutContext({ source, cardLabel, cardSlug });
    if (modified) return;
    pendingRef.current = true;
    setPending(true);
  }

  return (
    <div className={compact ? "" : "w-full"} data-analytics-checkout>
      <Link
        href={DEEP_DIVE_REVIEW_PATH}
        onClick={onClick}
        aria-busy={pending}
        aria-disabled={pending || undefined}
        className={
          compact
            ? `paper-button small-button text-center${pending ? " cursor-wait opacity-70" : ""}`
            : `accent-button large-button w-full text-center${pending ? " cursor-wait opacity-70" : ""}`
        }
      >
        {pending
          ? "Opening your question…"
          : submitLabel || `Ask your question — ${DEEP_DIVE_PRICE_LABEL}`}
      </Link>
    </div>
  );
}
