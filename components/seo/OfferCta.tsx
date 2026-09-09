import Link from "next/link";

import {
  DEEP_DIVE_CALCULATOR_ENTRY_LABEL,
  DEEP_DIVE_CALCULATOR_FORM_HREF,
  DEEP_DIVE_PRICE_LABEL,
  DEEP_DIVE_PRODUCT_NAME,
} from "@/lib/deep-dive";

// Quiet contextual funnel block for educational pages that used to dead-end.
// Paid path: calculator → $19 52xSeven Blueprint.
export function OfferCta({ className = "" }: { className?: string }) {

  return (
    <aside className={`shell-ink border border-brand-on-dark-line p-6 sm:p-7 ${className}`}>
      <p className="type-eyebrow-dark">Free card name → your whole year</p>
      <h2 className="mt-3 max-w-2xl font-serif text-3xl leading-tight sm:text-4xl">
        Get your {DEEP_DIVE_PRODUCT_NAME}.
      </h2>
      <p className="mt-3 max-w-[38em] text-sm leading-relaxed text-brand-on-dark-soft sm:text-base">
        The free calculator stops at the card name. The {DEEP_DIVE_PRODUCT_NAME} ({DEEP_DIVE_PRICE_LABEL})
        puts your whole year on one map: your card, the 52-day chapter you are
        in right now, and all seven chapters with the story arc between them.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link
          href={DEEP_DIVE_CALCULATOR_FORM_HREF}
          className="accent-button large-button inline-flex text-center"
        >
          {DEEP_DIVE_CALCULATOR_ENTRY_LABEL}
        </Link>
        <Link
          href={DEEP_DIVE_CALCULATOR_FORM_HREF}
          className="text-sm font-medium text-brand-on-dark-soft underline underline-offset-4"
        >
          Or find the free card name first →
        </Link>
      </div>
    </aside>
  );
}
