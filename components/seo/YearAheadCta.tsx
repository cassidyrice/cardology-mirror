"use client";

import Link from "next/link";
import { useRef, useState, type MouseEvent } from "react";

import { trackClientFunnelEvent } from "@/components/analytics/AnalyticsCapture";
import { storeCheckoutBirthdate } from "@/lib/checkout-birthdate";
import {
  YEAR_AHEAD_CTA_LABEL,
  YEAR_AHEAD_ON_SALE,
  YEAR_AHEAD_PRODUCT_PATH,
  YEAR_AHEAD_REVIEW_PATH,
  YEAR_AHEAD_SLUG,
  yearAheadHeading,
} from "@/lib/year-ahead";

/**
 * Entry to Your Year Ahead ($19). Same shape as DeepDiveHostedCheckout: a real
 * link to the review page (/checkout/year-ahead), so it works before hydration.
 * With JavaScript the click keeps the birthday in this tab (sessionStorage,
 * never a URL) and the review page confirms it before Stripe.
 */
export function YearAheadCta({
  placement,
  birthdate,
  submitLabel = YEAR_AHEAD_CTA_LABEL,
  className = "",
}: {
  placement: string;
  birthdate?: string;
  submitLabel?: string;
  className?: string;
}) {
  const pendingRef = useRef(false);
  const [pending, setPending] = useState(false);
  if (!YEAR_AHEAD_ON_SALE) return null;

  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    if (pendingRef.current) {
      event.preventDefault();
      return;
    }
    trackClientFunnelEvent("offer_cta_clicked", {
      offerSlug: YEAR_AHEAD_SLUG,
      placement,
    });
    if (birthdate) storeCheckoutBirthdate(birthdate);
    const modified =
      event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
    if (modified) return;
    pendingRef.current = true;
    setPending(true);
  }

  return (
    <div className={`w-full ${className}`} data-analytics-checkout>
      <Link
        href={YEAR_AHEAD_REVIEW_PATH}
        onClick={onClick}
        aria-busy={pending}
        aria-disabled={pending || undefined}
        className={`accent-button large-button w-full text-center${pending ? " cursor-wait opacity-70" : ""}`}
      >
        {pending ? "Opening checkout…" : submitLabel}
      </Link>
    </div>
  );
}

/**
 * The card-specific offer right under a calculator result:
 * "Your year ahead as a Queen of Diamonds", one line, the $19 button.
 */
export function YearAheadResultOffer({
  cardLabel,
  birthdate,
  placement,
  className = "",
}: {
  cardLabel: string;
  birthdate: string;
  placement: string;
  className?: string;
}) {
  if (!YEAR_AHEAD_ON_SALE) return null;
  return (
    <div
      className={`w-full border border-brand-line bg-brand-ivory p-5 text-left ${className}`}
      data-offer="year-ahead"
    >
      <p className="font-serif text-xl leading-snug text-brand-ink">
        {yearAheadHeading(cardLabel)}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-brand-ink-soft">
        Birthday to birthday: your Long Range card, your Pluto card and what it
        pays, and all seven 52-day periods, dated. Ready the moment you pay. A
        mirror, not a forecast.
      </p>
      <YearAheadCta placement={placement} birthdate={birthdate} className="mt-4" />
      <p className="mt-2 text-center text-xs">
        <Link
          href={YEAR_AHEAD_PRODUCT_PATH}
          className="text-brand-ink-soft underline underline-offset-4"
        >
          What&rsquo;s in it
        </Link>
      </p>
    </div>
  );
}
