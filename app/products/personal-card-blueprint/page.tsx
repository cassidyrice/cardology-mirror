import type { Metadata } from "next";
import Link from "next/link";
import { BlueprintAmbient } from "@/components/brand/BlueprintAmbient";
import { ProductComparison } from "@/components/products/ProductComparison";

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

const TITLE = "Personal Card Blueprint ($13): Instant written report";
const DESCRIPTION =
  "Instant personalized written Cardology report: birth card, ruling card, and current 52-day period. $13 one time. Preview a sample.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "personal card blueprint",
    "playing card birth card report",
    "cardology blueprint",
    "written birth card report",
    "playing card archetype reading",
  ],
  alternates: { canonical: "/products/personal-card-blueprint" },
  openGraph: {
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "What is a Personal Card Blueprint?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "An instant written Cardology report: birth card, ruling card, current 52-day period, and three reflection prompts. A written pattern of the playing-card archetype; not a psychic prediction.",
                },
              },
              {
                "@type": "Question",
                name: "What do I actually get?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "You get an instant written report (birth card, ruling card, current 52-day period, prompts) plus an emailed return link. Direct, specific, and usable as a reflection — not a roast and not a horoscope. Not a psychic prediction.",
                },
              },
              {
                "@type": "Question",
                name: "How is this different from the free birth card calculator?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Free calculator: card name. Blueprint: the full written pattern, your current 52-day period, and prompts. Same engine; entertainment only — not a psychic prediction.",
                },
              },
              {
                "@type": "Question",
                name: "Is this tarot or AI fortune-telling?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "No. The mapping uses a fixed 52-card playing deck (Cardology). The report interprets that structure — not a shuffled tarot draw.",
                },
              },
            ],
          }),
        }}
      />
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
        <section className="shell-paper relative overflow-hidden">
          <BlueprintAmbient variant="blueprint" tone="paper" />
          <div className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-10 pt-8 sm:px-8 sm:pb-14 sm:pt-10 lg:px-10">
            <div className="max-w-[40rem]">
              <Kicker className="rise">
                Instant personalized written Cardology report
              </Kicker>
              <h1 className="mt-4 font-serif text-[2rem] leading-[1.12] text-brand-ink sm:text-4xl lg:text-5xl">
                Your birth card, ruling card, and current 52-day period — written down.
              </h1>
              <p className="mt-4 text-base leading-relaxed text-brand-ink-soft">
                A one-page-plus written report from one birth date. Instant
                access after checkout. No subscription, no phone call.
              </p>
              <p className="mt-2 text-sm font-medium text-brand-ink">
                {offer.priceLabel} one time · instant access · no subscription · plus applicable tax
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <LinkButton href={`/checkout/${offer.slug}`} variant="accent" size="large">
                  {offer.cta}
                </LinkButton>
                <LinkButton href="#sample-blueprint" variant="outline" size="large">
                  Preview a sample report
                </LinkButton>
              </div>
              <p className="mt-4 max-w-[38em] text-sm leading-relaxed text-brand-ink-soft">
                Secure Stripe checkout. Wrong date or failed delivery: we
                correct or refund. Birth dates stay in this browser tab — never
                in the checkout URL.
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
                <h2 className="type-h3">Your ruling card</h2>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-brand-ink-soft">
                  The ruling card is the style your core pattern expresses
                  through, and how others first experience you. Deck language,
                  not a sky chart.
                </p>
              </div>
              <div className="border-t border-brand-line pt-5">
                <h2 className="type-h3">Your current 52-day period</h2>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-brand-ink-soft">
                  The card season you are in now — the governing card for this
                  stretch of the calendar map, and how that period plays when
                  it is loud or quiet. Entertainment structure, not fate.
                </p>
              </div>
              <div className="border-t border-brand-line pt-5">
                <h2 className="type-h3">Three pointed questions</h2>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-brand-ink-soft">
                  Reflection prompts drawn from those specific cards — the
                  keepable part of the written pattern, not a live reading.
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

            <ProductComparison />

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
          id="blueprint-faq"
          aria-labelledby="blueprint-faq-heading"
          className="shell-paper border-t border-brand-line"
        >
          <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8 lg:px-10">
            <Kicker>FAQ</Kicker>
            <h2 id="blueprint-faq-heading" className="type-h2 mt-4 text-brand-ink">
              Personal Card Blueprint FAQ
            </h2>
            <div className="mt-8 space-y-6">
              {[
                {
                  q: "What is a Personal Card Blueprint?",
                  a: "An instant written Cardology report from a birthday: birth card and ruling card in plain language, your current 52-day period, and three reflection prompts — same engine as the free calculator. A written pattern of the playing-card archetype, not a psychic prediction.",
                },
                {
                  q: "What do I actually get?",
                  a: "You get a one-time personalized written report plus an emailed return link: pattern, ruling card, current 52-day period, prompts. Direct enough to use as a reflection. Never body, trauma, job, or fate. Entertainment only; not a psychic prediction.",
                },
                {
                  q: "How is this different from the free birth card calculator?",
                  a: "Free calculator: the card name (and ruling card). Blueprint: the locked written layers — pattern, current 52-day period, prompts — as a report you can reopen. Same calendar math; still entertainment, not a psychic prediction.",
                },
                {
                  q: "Is this tarot or AI fortune-telling?",
                  a: "No. Fixed 52-card playing-deck calendar (Cardology). The report is a written entertainment interpretation of that structure — not a shuffled tarot draw, not fate, and not a phone psychic session.",
                },
              ].map((f) => (
                <div key={f.q} className="border-t border-brand-line pt-5">
                  <h3 className="type-h3 text-brand-ink">{f.q}</h3>
                  <p className="mt-3 text-[0.95rem] leading-relaxed text-brand-ink-soft">
                    {f.a}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-10">
              <LinkButton href={`/checkout/${offer.slug}`} variant="accent" size="large">
                {offer.cta}
              </LinkButton>
              <p className="mt-3">
                <Link
                  href="/birth-card-calculator"
                  className="text-sm font-medium text-brand-ink underline underline-offset-4"
                >
                  Or find your birth card free first →
                </Link>
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
