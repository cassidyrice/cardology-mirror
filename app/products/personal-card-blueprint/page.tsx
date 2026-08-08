import type { Metadata } from "next";
import Link from "next/link";

import { BlueprintReportView } from "@/components/blueprint/BlueprintReportView";
import { SiteFooter } from "@/components/seo/SiteFooter";
import { SiteHeader } from "@/components/seo/SiteHeader";
import { Kicker, LinkButton } from "@/components/ui";
import {
  SAMPLE_BLUEPRINT,
  SAMPLE_BLUEPRINT_BIRTHDATE_DISPLAY,
} from "@/lib/blueprint-sample";
import {
  instantReportBySlug,
  instantReportFacts,
} from "@/lib/products";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const offer = instantReportBySlug("personal-card-blueprint");

export const metadata: Metadata = {
  title: "Personal Card Blueprint | Card Blueprints",
  description:
    "Your birth-card pattern, ruling layer, and current chapter — a personalized Cardology report delivered instantly after checkout. See a full sample Blueprint before you buy.",
  alternates: { canonical: "/products/personal-card-blueprint" },
  openGraph: {
    siteName: SITE_NAME,
    title: "Personal Card Blueprint | Card Blueprints",
    description:
      "A personalized Cardology report from your birthday — birth card, ruling card, and the chapter you're in now. Instant, no phone call. Preview a sample first.",
    url: "/products/personal-card-blueprint",
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Card Blueprints" }],
  },
};

export default function PersonalCardBlueprintPage() {
  if (!offer) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: offer.name,
    description: offer.oneLine,
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "Offer",
      price: offer.price,
      priceCurrency: "USD",
      url: `${SITE_URL}/products/personal-card-blueprint`,
      hasMerchantReturnPolicy: {
        "@id": `${SITE_URL}/refund-policy#merchant-return-policy`,
      },
    },
  };

  return (
    <div className="bg-brand-paper text-brand-ink">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
        <section className="shell-paper">
          <div className="mx-auto w-full max-w-6xl px-5 pb-[clamp(4rem,8vw,6rem)] pt-[clamp(3.25rem,7vw,5.5rem)] sm:px-8 lg:px-10">
            <div className="max-w-[54rem]">
              <Kicker className="rise">Personal Card Blueprint &middot; instant report</Kicker>
              <h1 className="type-display rise-2 mt-6">
                More than your card. The <em>whole pattern</em>, in writing.
              </h1>
              <p className="type-body-lg rise-3 mt-7 max-w-[36em] text-brand-ink-soft">
                {offer.oneLine} Enter your birth date at checkout and read your
                personalized Blueprint the second payment clears — no phone
                call, no appointment, no waiting.
              </p>
              <div className="rise-4 mt-9 flex flex-col gap-3 sm:flex-row">
                <LinkButton href={`/checkout/${offer.slug}`} variant="accent" size="large">
                  {offer.cta}
                </LinkButton>
                <LinkButton href="#sample-blueprint" variant="outline" size="large">
                  Preview a sample report
                </LinkButton>
              </div>
              <p className="rise-4 mt-5 max-w-[38em] text-sm leading-relaxed text-brand-ink-soft">
                One-time payment &middot; generated from the deterministic
                Cardology calculation &middot; emailed return link included
              </p>
            </div>
          </div>
        </section>

        <section className="shell-paper-deep border-t border-brand-line">
          <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 lg:px-10">
            <Kicker>What&rsquo;s inside</Kicker>
            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              <div className="border-t border-brand-line pt-5">
                <h2 className="type-h3">Your birth card, in plain language</h2>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-brand-ink-soft">
                  The core pattern your birthday carries — strengths, blind
                  spots, and the growth edge, from the fixed engine data, not
                  horoscope fog.
                </p>
              </div>
              <div className="border-t border-brand-line pt-5">
                <h2 className="type-h3">Your ruling layer</h2>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-brand-ink-soft">
                  The planetary ruling card — the style your core pattern
                  expresses through, and how others first experience you.
                </p>
              </div>
              <div className="border-t border-brand-line pt-5">
                <h2 className="type-h3">The chapter you&rsquo;re in now</h2>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-brand-ink-soft">
                  Your current planetary period and its governing card — what
                  this stretch of the year is asking, and how it slips when
                  you&rsquo;re off-center.
                </p>
              </div>
              <div className="border-t border-brand-line pt-5">
                <h2 className="type-h3">Three pointed questions</h2>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-brand-ink-soft">
                  Reflection prompts drawn from your specific cards — the part
                  of a reading people actually remember and use.
                </p>
              </div>
            </div>

            <div className="mt-12 border-y border-brand-line py-8">
              <dl>
                {instantReportFacts(offer).map((fact) => (
                  <div
                    key={fact.label}
                    className="grid gap-1 py-4 sm:grid-cols-[7rem_1fr] sm:gap-4 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-brand-line"
                  >
                    <dt className="font-medium text-brand-ink">{fact.label}</dt>
                    <dd className="text-sm leading-relaxed text-brand-ink-soft">
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="mt-10 text-center">
              <LinkButton href={`/checkout/${offer.slug}`} variant="accent" size="large">
                {offer.cta}
              </LinkButton>
              <p className="mt-3 text-xs leading-relaxed text-brand-ink-soft">
                {offer.checkoutNote}
              </p>
            </div>
          </div>
        </section>

        <section
          id="sample-blueprint"
          aria-labelledby="sample-blueprint-heading"
          className="shell-paper border-t border-brand-line"
        >
          <div className="mx-auto max-w-4xl px-5 py-14 sm:px-8 lg:px-10">
            <Kicker>See the real structure</Kicker>
            <h2 id="sample-blueprint-heading" className="type-h2 mt-4 text-brand-ink">
              Full sample Blueprint
            </h2>
            <p className="mt-3 max-w-[40em] text-[0.95rem] leading-relaxed text-brand-ink-soft">
              Same sections you get after checkout — generated by the live
              Cardology engine for an example birthday. Not a customer report.
              Your purchase uses <em>your</em> date.
            </p>

            <div className="report-stack mt-10 rounded-sm border border-brand-line bg-brand-paper p-6 sm:p-8 lg:p-10">
              <BlueprintReportView
                report={SAMPLE_BLUEPRINT}
                sample
                birthdateDisplay={SAMPLE_BLUEPRINT_BIRTHDATE_DISPLAY}
              />
            </div>

            <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <LinkButton href={`/checkout/${offer.slug}`} variant="accent" size="large">
                {offer.cta}
              </LinkButton>
              <Link
                href="/birth-card-calculator"
                className="text-sm font-medium text-brand-ink underline underline-offset-4"
              >
                Find your birth card free first →
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
