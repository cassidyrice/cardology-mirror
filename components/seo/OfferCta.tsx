import Link from "next/link";

import { instantReportBySlug } from "@/lib/products";

// Quiet contextual funnel block for educational pages that used to dead-end.
// One active paid path: the Personal Card Blueprint.
export function OfferCta({ className = "" }: { className?: string }) {
  const offer = instantReportBySlug("personal-card-blueprint");
  const priceLabel = offer?.priceLabel ?? "$13";

  return (
    <aside className={`shell-ink border border-brand-on-dark-line p-6 sm:p-7 ${className}`}>
      <p className="type-eyebrow-dark">Want the full pattern in one place?</p>
      <h2 className="mt-3 max-w-2xl font-serif text-3xl leading-tight sm:text-4xl">
        Get your Personal Card Blueprint.
      </h2>
      <p className="mt-3 max-w-[38em] text-sm leading-relaxed text-brand-on-dark-soft sm:text-base">
        An instant personalized written report connecting your birth card,
        ruling layer, current chapter, and reflection prompts. One payment,
        no subscription.
      </p>
      <div className="mt-6">
        <Link
          href="/products/personal-card-blueprint"
          className="accent-button large-button inline-flex text-center"
        >
          {`Get My Blueprint — ${priceLabel}`}
        </Link>
      </div>
    </aside>
  );
}
