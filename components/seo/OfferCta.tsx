import Link from "next/link";

import { instantReportBySlug } from "@/lib/products";

// Quiet contextual funnel block for educational pages that used to dead-end.
// One active paid path: the Personal Card Blueprint.
export function OfferCta({ className = "" }: { className?: string }) {
  const offer = instantReportBySlug("personal-card-blueprint");
  const priceLabel = offer?.priceLabel ?? "$13";

  return (
    <aside className={`shell-ink border border-brand-on-dark-line p-6 sm:p-7 ${className}`}>
      <p className="type-eyebrow-dark">Impulse gift of self-knowledge</p>
      <h2 className="mt-3 max-w-2xl font-serif text-3xl leading-tight sm:text-4xl">
        Get your Personal Card Blueprint.
      </h2>
      <p className="mt-3 max-w-[38em] text-sm leading-relaxed text-brand-on-dark-soft sm:text-base">
        Impulse gift of self-knowledge — a birthday playing-card read you can send someone, not a psychic prediction. One payment, no subscription — entertainment only.
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
