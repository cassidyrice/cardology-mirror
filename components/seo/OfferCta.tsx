import Link from "next/link";

import {
  READER_PHONE_DISPLAY,
  READER_PHONE_TEL,
  TRIAL_NAME,
  TRIAL_OFFER,
  TRIAL_PATH,
  TRIAL_PRICE_LABEL,
} from "@/lib/offers";
import { offerBySlug, readingOfferHref } from "@/lib/products";

// Compact funnel block for pages that used to dead-end (blog pillar hubs,
// gated app pages, onboarding): free teaser call → $9 trial → $99 pass.
// All colors are explicit so it reads correctly on both the paper (SeoShell)
// and ink (app) surfaces. Server-safe: no client hooks.
export function OfferCta({ className = "" }: { className?: string }) {
  const pass = offerBySlug("one-question-reading");

  return (
    <aside className={`border border-[#f4f0e7]/15 bg-[#14110d] p-6 text-[#f4f0e7] sm:p-7 ${className}`}>
      <p className="oracle-eyebrow text-[#c8bca8]">Hear it read to you</p>
      <h2 className="mt-3 max-w-2xl font-serif text-3xl leading-none sm:text-4xl">
        The AI reader is on the line. Your first card is free.
      </h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <a
          href={READER_PHONE_TEL}
          className="block border border-[#f4f0e7]/20 bg-[#f4f0e7]/[0.04] p-4 transition hover:bg-[#f4f0e7]/10"
        >
          <p className="font-serif text-2xl text-[#d9b26a]">Free</p>
          <p className="mt-1 font-serif text-lg leading-tight text-[#f4f0e7]">
            Call {READER_PHONE_DISPLAY}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[#c8bca8]">
            The AI reader answers, asks your birthday, and reads your card on
            the spot. No account, no credit card.
          </p>
        </a>
        <Link
          href={TRIAL_PATH}
          className="block border border-[#f4f0e7]/20 bg-[#f4f0e7]/[0.04] p-4 transition hover:bg-[#f4f0e7]/10"
        >
          <p className="font-serif text-2xl text-[#d9b26a]">
            {TRIAL_OFFER.trialAvailable ? TRIAL_PRICE_LABEL : "Trial"}
          </p>
          <p className="mt-1 font-serif text-lg leading-tight text-[#f4f0e7]">{TRIAL_NAME}</p>
          <p className="mt-2 text-xs leading-relaxed text-[#c8bca8]">
            {TRIAL_OFFER.trialAvailable
              ? "Seven days of unlimited AI readings by phone."
              : "Opening soon — see how seven days of unlimited readings works."}
          </p>
        </Link>
        {pass && (
          <Link
            href={readingOfferHref(pass)}
            className="block border border-[#f4f0e7]/20 bg-[#f4f0e7]/[0.04] p-4 transition hover:bg-[#f4f0e7]/10"
          >
            <p className="font-serif text-2xl text-[#d9b26a]">{pass.priceLabel}</p>
            <p className="mt-1 font-serif text-lg leading-tight text-[#f4f0e7]">{pass.name}</p>
            <p className="mt-2 text-xs leading-relaxed text-[#c8bca8]">
              The full pass — unlimited calls, compatibility lookups, and daily
              cards for 90 days.
            </p>
          </Link>
        )}
      </div>
    </aside>
  );
}
