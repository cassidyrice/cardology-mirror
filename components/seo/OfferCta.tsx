import Link from "next/link";

import { READING_OFFERS, readingOfferHref } from "@/lib/products";
import { READINGS_PATH } from "@/lib/site";

const videoOffer = READING_OFFERS[0];

// Quiet contextual funnel block for educational pages that used to dead-end
// (blog pillar hubs, gated app pages, onboarding). One thought, two actions:
// get the personal video reading, or read the offer details. All colors are
// explicit so it reads correctly on both the paper (SeoShell) and ink (app)
// surfaces. Server-safe: no client hooks.
export function OfferCta({ className = "" }: { className?: string }) {
  return (
    <aside className={`shell-ink border border-brand-on-dark-line p-6 sm:p-7 ${className}`}>
      <p className="type-eyebrow-dark">Want this pattern read for you?</p>
      <h2 className="mt-3 max-w-2xl font-serif text-3xl leading-tight sm:text-4xl">
        Get your personal video reading.
      </h2>
      <p className="mt-3 max-w-[38em] text-sm leading-relaxed text-brand-on-dark-soft sm:text-base">
        Send a birth date at checkout — a personally-made Cardology video
        reading arrives in your inbox within 48 hours. Made for you, and yours
        to keep.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link href={readingOfferHref(videoOffer)} className="accent-button large-button text-center">
          {videoOffer.cta}
        </Link>
        <Link
          href={READINGS_PATH}
          className="editorial-link text-center text-sm text-brand-on-dark-soft sm:text-left"
        >
          How it works &rarr;
        </Link>
      </div>
    </aside>
  );
}
