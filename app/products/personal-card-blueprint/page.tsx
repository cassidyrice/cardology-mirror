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

const TITLE = "Personal Card Blueprint ($13): Instant Birth Card Report";
const DESCRIPTION =
  "Instant Cardology birth-card report: pattern, ruling layer, current chapter. Playing cards, not a psychic call. Gift-ready — preview a sample first.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "personal card blueprint",
    "cardology report",
    "birth card report",
    "birthday gift personality reading",
    "playing card birth card reading",
    "cardology blueprint",
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
                  text: "An instant written Cardology report from your birthday: birth card and ruling layer in plain language, the chapter you are in now, and three reflection questions.",
                },
              },
              {
                "@type": "Question",
                name: "Is this a good birthday gift?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes. It is a one-time personalized playing-card birth-card report delivered instantly after checkout — not a live psychic call.",
                },
              },
              {
                "@type": "Question",
                name: "How is this different from the free birth card calculator?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "The free calculator shows your birth card. The Blueprint writes out the full pattern, current chapter, and reflection prompts.",
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
        <section className="shell-paper">
          <div className="mx-auto w-full max-w-6xl px-5 pb-[clamp(4rem,8vw,6rem)] pt-[clamp(3.25rem,7vw,5.5rem)] sm:px-8 lg:px-10">
            <div className="max-w-[54rem]">
              <Kicker className="rise">
                Personal Card Blueprint &middot; {offer.priceLabel} &middot; instant
              </Kicker>
              <h1 className="type-display rise-2 mt-6">
                More than your card. The <em>whole pattern</em>, in writing.
              </h1>
              <p className="type-body-lg rise-3 mt-7 max-w-[36em] text-brand-ink-soft">
                {offer.oneLine} Enter your birth date at checkout and read your
                personalized Blueprint the second payment clears — no phone
                call, no appointment, no waiting.
              </p>
              <p className="rise-3 mt-4 max-w-[38em] text-sm leading-relaxed text-brand-ink-soft">
                Built for self-knowledge and gifting: a checkable playing-card
                birth-card report, not a psychic hotline or tarot shuffle.
                Free calculator first if you only want the card name.
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
                  a: "An instant written Cardology report from your birthday: birth card and ruling layer in plain language, the chapter you are in now, and three reflection questions. Same deterministic engine as the free calculator — the Blueprint puts the full pattern in front of you.",
                },
                {
                  q: "Is this a good birthday gift?",
                  a: "Yes. It is a one-time personalized personality-style report based on a playing-card birth card, delivered instantly after checkout. Recipients get a return link by email. It is not a live psychic call.",
                },
                {
                  q: "How is this different from the free birth card calculator?",
                  a: "The free calculator shows your birth card (and ruling card). The Blueprint writes out the pattern, timing chapter, and prompts so you can keep and revisit the reading without piecing pages together yourself.",
                },
                {
                  q: "Is this tarot or AI fortune-telling?",
                  a: "No. The card mapping is a fixed 52-card playing-deck calendar (Cardology). The report is a written interpretation of that structure — not a shuffled tarot draw and not a phone psychic session.",
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
