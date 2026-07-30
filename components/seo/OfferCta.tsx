import Link from "next/link";

import { READER_PHONE_DISPLAY, READER_PHONE_TEL } from "@/lib/offers";
import { READINGS_PATH } from "@/lib/site";

// Quiet contextual funnel block for educational pages that used to dead-end
// (blog pillar hubs, gated app pages, onboarding). One thought, two actions:
// hear the free preview, or compare the paid readings. All colors are
// explicit so it reads correctly on both the paper (SeoShell) and ink (app)
// surfaces. Server-safe: no client hooks.
export function OfferCta({ className = "" }: { className?: string }) {
  return (
    <aside className={`shell-ink border border-brand-on-dark-line p-6 sm:p-7 ${className}`}>
      <p className="type-eyebrow-dark">Want to talk this pattern through?</p>
      <h2 className="mt-3 max-w-2xl font-serif text-3xl leading-tight sm:text-4xl">
        Ask the AI Cardology reader.
      </h2>
      <p className="mt-3 max-w-[38em] text-sm leading-relaxed text-brand-on-dark-soft sm:text-base">
        Call free and hear a short introduction to your birth card — no
        account, no payment. When there is a real question on the table, the
        paid readings go deeper.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <a href={READER_PHONE_TEL} className="accent-button large-button text-center">
          Call Free: {READER_PHONE_DISPLAY}
        </a>
        <Link
          href={READINGS_PATH}
          className="editorial-link text-center text-sm text-brand-on-dark-soft sm:text-left"
        >
          Compare the readings &rarr;
        </Link>
      </div>
    </aside>
  );
}
