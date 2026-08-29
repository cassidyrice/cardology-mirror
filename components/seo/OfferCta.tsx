import Link from "next/link";

import { DEEP_DIVE_CTA_LABEL } from "@/lib/deep-dive";

// Quiet contextual funnel block for educational pages that used to dead-end.
// One active paid path: the Personal Card Blueprint.
export function OfferCta({ className = "" }: { className?: string }) {

  return (
    <aside className={`shell-ink border border-brand-on-dark-line p-6 sm:p-7 ${className}`}>
      <p className="type-eyebrow-dark">Free card name → written pattern</p>
      <h2 className="mt-3 max-w-2xl font-serif text-3xl leading-tight sm:text-4xl">
        Get your Birth Card Deep Dive.
      </h2>
      <p className="mt-3 max-w-[38em] text-sm leading-relaxed text-brand-on-dark-soft sm:text-base">
        The free calculator stops at the card name. The Deep Dive ($9) writes
        the pattern down with a grounded reading, System Guide, and 90 Spreads.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link
          href="/birth-card-calculator"
          className="accent-button large-button inline-flex text-center"
        >
          {DEEP_DIVE_CTA_LABEL}
        </Link>
        <Link
          href="/birth-card-calculator"
          className="text-sm font-medium text-brand-on-dark-soft underline underline-offset-4"
        >
          Or find the free card name first →
        </Link>
      </div>
    </aside>
  );
}
