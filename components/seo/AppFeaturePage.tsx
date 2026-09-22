import Link from "next/link";
import type { ReactNode } from "react";

import { OfferCta } from "@/components/seo/OfferCta";
import { SeoShell } from "@/components/seo/SeoShell";
import { Kicker } from "@/components/ui";
import { SITE_NAME, abs } from "@/lib/site";

export function AppFeaturePage({
  title,
  description,
  canonicalPath,
  eyebrow,
  points,
  children,
  note,
  calculatorLabel = "Find your birth card",
  showOffer = true,
}: {
  title: string;
  description: string;
  canonicalPath: string;
  eyebrow: string;
  points: string[];
  children: ReactNode;
  /** Short line beside the free calculator, for pages that need the fixed-map escape. */
  note?: string;
  calculatorLabel?: string;
  /** Shared end-of-page offer. Off when this page places a quieter ask after context. */
  showOffer?: boolean;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: abs(canonicalPath),
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: abs("/"),
    },
  };

  return (
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: title, href: canonicalPath }]}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="max-w-3xl pb-8">
        <Kicker className="mb-4">{eyebrow}</Kicker>
        <h1 className="type-display text-brand-ink">{title}</h1>
        <p className="mt-5 max-w-2xl font-serif text-xl leading-relaxed text-brand-ink-soft sm:text-2xl">
          {description}
        </p>
        {note ? (
          <p className="mt-4 text-sm font-medium leading-relaxed text-brand-ink">
            {note}
          </p>
        ) : null}
        <div className={`flex flex-col gap-3 sm:flex-row ${note ? "mt-4" : "mt-6"}`}>
          <Link
            href="/birth-card-calculator"
            className="ink-button large-button"
          >
            {calculatorLabel}
          </Link>
          <Link
            href="/onboarding"
            className="paper-button large-button"
          >
            Create your profile
          </Link>
        </div>
      </header>

      <section className="rounded-[3px] border border-brand-line bg-brand-ivory p-5 sm:p-6">
        <Kicker className="mb-4">On this page</Kicker>
        <ul className="space-y-3 text-sm leading-relaxed text-brand-ink-soft sm:text-base">
          {points.map((point) => (
            <li key={point} className="border-t border-brand-line pt-3 first:border-t-0 first:pt-0">
              {point}
            </li>
          ))}
        </ul>
      </section>

      <section className="app-paper-stage mt-10 border-y border-brand-line bg-brand-paper-deep">
        {children}
      </section>

      {showOffer ? <OfferCta className="mt-10" /> : null}
    </SeoShell>
  );
}
