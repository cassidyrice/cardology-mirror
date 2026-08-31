"use client";

import { useState, type FormEvent } from "react";

import { trackClientFunnelEvent } from "@/components/analytics/AnalyticsCapture";
import {
  DEEP_DIVE_OFFER_SLUG,
  DEEP_DIVE_PRICE_LABEL,
  DEEP_DIVE_SESSION_PATH,
} from "@/lib/deep-dive";

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
  const [pending, setPending] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    if (pending) {
      event.preventDefault();
      return;
    }
    setPending(true);
    trackClientFunnelEvent("offer_cta_clicked", {
      offerSlug: DEEP_DIVE_OFFER_SLUG,
      placement: source,
    });
  }

  return (
    <form
      action={DEEP_DIVE_SESSION_PATH}
      method="post"
      className={compact ? "" : "w-full"}
      data-analytics-checkout
      onSubmit={onSubmit}
    >
      <input type="hidden" name="birthdate" value={birthdate} />
      <input type="hidden" name="source" value={source} />
      {cardLabel ? (
        <input type="hidden" name="cardLabel" value={cardLabel} />
      ) : null}
      {cardSlug ? (
        <input type="hidden" name="cardSlug" value={cardSlug} />
      ) : null}
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className={
          compact
            ? "accent-button small-button text-center disabled:cursor-wait disabled:opacity-70"
            : "accent-button large-button w-full text-center disabled:cursor-wait disabled:opacity-70 sm:w-auto"
        }
      >
        {pending
          ? "Redirecting to Secure Checkout…"
          : submitLabel ||
            `Continue to Secure Checkout — ${DEEP_DIVE_PRICE_LABEL}`}
      </button>
    </form>
  );
}
