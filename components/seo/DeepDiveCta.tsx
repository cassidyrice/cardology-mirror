"use client";

import { type FormEvent, useState } from "react";

import { trackClientFunnelEvent } from "@/components/analytics/AnalyticsCapture";
import { DeepDiveHostedCheckout } from "@/components/checkout/DeepDiveHostedCheckout";
import { sanitizeBirthdateISO } from "@/lib/birthdate";
import {
  DEEP_DIVE_CTA_LABEL,
  DEEP_DIVE_FULFILLMENT,
  DEEP_DIVE_OFFER_SLUG,
  DEEP_DIVE_PRICE_LABEL,
  sanitizeDeepDiveSource,
} from "@/lib/deep-dive";

export function DeepDiveCta({
  placement,
  birthdate,
  source = "birth-card-calculator",
  cardLabel,
  cardSlug,
  className = "",
}: {
  placement: string;
  birthdate?: string;
  source?: string;
  cardLabel?: string;
  cardSlug?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draftDate, setDraftDate] = useState("");
  const iso =
    sanitizeBirthdateISO(birthdate) || sanitizeBirthdateISO(draftDate);
  const ctaLabel = cardLabel
    ? `Get the ${cardLabel} Deep Dive — ${DEEP_DIVE_PRICE_LABEL}`
    : DEEP_DIVE_CTA_LABEL;

  function submitDate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = sanitizeBirthdateISO(draftDate);
    if (next) setDraftDate(next);
  }

  const compact = placement === "site-header";

  return (
    <div
      className={
        compact
          ? `flex flex-col items-center ${className}`
          : `flex w-full max-w-md flex-col items-center gap-3 ${className}`
      }
    >
      {iso ? (
        <DeepDiveHostedCheckout
          birthdate={iso}
          source={sanitizeDeepDiveSource(source)}
          cardLabel={cardLabel}
          cardSlug={cardSlug}
          compact={compact}
          submitLabel={ctaLabel}
        />
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
            className="accent-button large-button w-full text-center sm:w-auto"
          >
            Continue
          </button>
        </form>
      ) : (
        <button
          type="button"
          className={
            compact
              ? "accent-button small-button text-center"
              : "accent-button large-button w-full text-center sm:w-auto"
          }
          onClick={() => {
            trackClientFunnelEvent("offer_cta_clicked", {
              offerSlug: DEEP_DIVE_OFFER_SLUG,
              placement,
            });
            setOpen(true);
          }}
        >
          {ctaLabel}
        </button>
      )}
      {!compact && (
        <p className="text-center text-xs leading-relaxed text-brand-ink-soft">
          {DEEP_DIVE_FULFILLMENT}
        </p>
      )}
    </div>
  );
}
