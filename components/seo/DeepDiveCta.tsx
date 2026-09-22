"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

import { trackClientFunnelEvent } from "@/components/analytics/AnalyticsCapture";
import { DeepDiveHostedCheckout } from "@/components/checkout/DeepDiveHostedCheckout";
import { sanitizeBirthdateISO } from "@/lib/birthdate";
import { storeCheckoutContext } from "@/lib/checkout-question";
import {
  DEEP_DIVE_CTA_LABEL,
  DEEP_DIVE_FULFILLMENT,
  DEEP_DIVE_HEADER_CTA_LABEL,
  DEEP_DIVE_OFFER_SLUG,
  DEEP_DIVE_PRICE_LABEL,
  DEEP_DIVE_PRODUCT_PATH,
  sanitizeDeepDiveSource,
} from "@/lib/deep-dive";

export function DeepDiveCta({
  placement,
  birthdate,
  source = "birth-card-calculator",
  cardLabel,
  cardSlug,
  className = "",
  showFulfillment = true,
  variant = "button",
  href = DEEP_DIVE_PRODUCT_PATH,
}: {
  placement: string;
  birthdate?: string;
  source?: string;
  cardLabel?: string;
  cardSlug?: string;
  className?: string;
  /** Hide the "What $13 gets you" line when the surrounding card already itemizes it. */
  showFulfillment?: boolean;
  /** Header row uses the quiet button. The mobile menu uses a full-width text row. */
  variant?: "button" | "menu";
  /** Real destination when JavaScript is off. With JS, the click still opens the birthday field. */
  href?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draftDate, setDraftDate] = useState("");
  const iso =
    sanitizeBirthdateISO(birthdate) || sanitizeBirthdateISO(draftDate);
  const ctaLabel = cardLabel
    ? `Ask your question as the ${cardLabel} — ${DEEP_DIVE_PRICE_LABEL}`
    : DEEP_DIVE_CTA_LABEL;

  function submitDate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = sanitizeBirthdateISO(draftDate);
    if (next) setDraftDate(next);
  }

  const compact = placement === "site-header";
  const menu = variant === "menu";
  const resolvedSource = sanitizeDeepDiveSource(source);

  function trackOfferClick() {
    trackClientFunnelEvent("offer_cta_clicked", {
      offerSlug: DEEP_DIVE_OFFER_SLUG,
      placement,
    });
  }

  function startHeaderReading() {
    trackOfferClick();
    storeCheckoutContext({
      source: resolvedSource,
      cardLabel,
      cardSlug,
    });
  }

  return (
    <div
      className={
        compact
          ? menu
            ? className
            : `flex flex-col items-center ${className}`
          : `flex w-full max-w-md flex-col items-center gap-3 ${className}`
      }
    >
      {iso ? (
        <DeepDiveHostedCheckout
          birthdate={iso}
          source={resolvedSource}
          cardLabel={cardLabel}
          cardSlug={cardSlug}
          compact={compact}
          submitLabel={ctaLabel}
        />
      ) : compact ? (
        <Link
          href={DEEP_DIVE_PRODUCT_PATH}
          data-money-path="reading"
          className={
            menu
              ? "money-path-offer block min-h-11 py-3 font-semibold text-brand-ink"
              : "paper-button small-button header-offer-link money-path-offer shrink-0 text-center"
          }
          onClick={startHeaderReading}
        >
          {DEEP_DIVE_HEADER_CTA_LABEL}
        </Link>
      ) : open ? (
        <form
          onSubmit={submitDate}
          className="flex w-full flex-col items-center gap-3"
        >
          <label
            htmlFor={`deep-dive-bd-${placement}`}
            className="type-eyebrow block w-full text-center"
          >
            Enter your birthday
          </label>
          <input
            id={`deep-dive-bd-${placement}`}
            type="date"
            value={draftDate}
            onChange={(event) => setDraftDate(event.target.value)}
            className="w-full rounded-[3px] border border-brand-line-strong bg-brand-paper px-4 py-3 font-serif text-brand-ink"
            required
          />
          <button
            type="submit"
            className="accent-button large-button w-full text-center"
          >
            Continue
          </button>
        </form>
      ) : (
        <Link
          href={href}
          className="accent-button large-button w-full text-center"
          onClick={(event) => {
            event.preventDefault();
            trackOfferClick();
            setOpen(true);
          }}
        >
          {ctaLabel}
        </Link>
      )}
      {!compact && showFulfillment && (
        <p className="text-center text-xs leading-relaxed text-brand-ink-soft">
          {DEEP_DIVE_FULFILLMENT}
        </p>
      )}
    </div>
  );
}
