import Link from "next/link";

import { instantReportBySlug } from "@/lib/products";

// Quiet contextual funnel block for educational pages that used to dead-end.
// One active paid path: the Personal Card Blueprint.
export function OfferCta({ className = "" }: { className?: string }) {
  const offer = instantReportBySlug("personal-card-blueprint");
  const priceLabel = offer?.priceLabel ?? "$13";

  return (
    <aside className={`shell-ink border border-brand-on-dark-line p-6 sm:p-7 ${className}`}>
      <p className="type-eyebrow-dark">Free card name → sendable gag</p>
      <h2 className="mt-3 max-w-2xl font-serif text-3xl leading-tight sm:text-4xl">
        Get your Personal Card Blueprint.
      </h2>
      <p className="mt-3 max-w-[38em] text-sm leading-relaxed text-brand-on-dark-soft sm:text-base">
        The free calculator stops at the card name. The Blueprint ({priceLabel})
        is the cursed birthday-card gag in writing — pattern, ruling layer,
        this year&apos;s bit in the deck, prompts. Gag-framed written pattern of
        the playing-card archetype; not a psychic prediction. One payment, no
        subscription.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link
          href="/products/personal-card-blueprint"
          className="accent-button large-button inline-flex text-center"
        >
          {`Get My Blueprint — ${priceLabel}`}
        </Link>
        <Link
          href="/birth-card-calculator"
          className="text-sm font-medium text-brand-on-dark-soft underline underline-offset-4"
        >
          Or grab the free card name first →
        </Link>
      </div>
    </aside>
  );
}
