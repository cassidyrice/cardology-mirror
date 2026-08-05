import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { Kicker, LinkButton, PricingCard } from "@/components/ui";
import {
  MICROTRUST_LINE,
  VIDEO_DELIVERY_CLARIFIER,
  VIDEO_DELIVERY_COPY,
} from "@/lib/offers";
import { READING_OFFERS } from "@/lib/products";
import { CONTACT_EMAIL, SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

const videoOffer = READING_OFFERS[0];

export const metadata: Metadata = {
  title: "Personal Video Reading — $99 | Card Blueprints",
  description:
    "One offer: a personally-made Cardology video reading from your birth date — and your question, if you have one — delivered as a private video link by email within 48 hours.",
  alternates: { canonical: "/readings" },
  openGraph: {
    siteName: SITE_NAME,
    title: "Personal Video Cardology Reading",
    description:
      "A personally-made Cardology video reading from your birth date, delivered by email within 48 hours.",
    url: "/readings",
    type: "website",
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Card Blueprints" }],
  },
};

const visibleFaqs = [
  {
    q: "Is the reading live?",
    a: "No. There is nothing to schedule and no call to make. Your reading is made after checkout and delivered as a private video link you can watch — and rewatch — whenever you want.",
  },
  {
    q: "What information do I need?",
    a: "A birth date — yours, or the person the reading is for. At checkout you can also add the question or focus you want the reading to speak to. Stripe Checkout asks for your email and payment details; Card Blueprints does not require a site account.",
  },
  {
    q: "Who makes the video?",
    a: "Each video is produced individually for the person who ordered it — written and voiced with AI, personalized from the birth date and question given at checkout, and reviewed before delivery. The birth-card calculation underneath is deterministic: the same birthday always produces the same card. It is not a generic pre-made video.",
  },
  {
    q: "When will my video arrive?",
    a: `Within 48 hours of checkout, at the email address you used at payment. If it has not arrived by then, check spam and promotions folders, then email ${CONTACT_EMAIL} and we will make it right.`,
  },
  {
    q: "What is the refund policy?",
    a: "Full refund any time before your video is delivered — no questions asked. After delivery, refunds are limited and reviewed fairly: if the video does not play or was not delivered as described, contact us and we will make it right. See the refund policy for details.",
  },
  {
    q: "Is this prediction or advice?",
    a: "No. Cardology is a symbolic reflection framework — not prediction, advice, or diagnosis. The reading is made for reflection and entertainment; check important facts for yourself.",
  },
];

export default function ReadingsPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Personal Video Cardology Reading",
      description: metadata.description,
      url: `${SITE_URL}/readings`,
      publisher: { "@id": `${SITE_URL}/#organization` },
      mainEntity: {
        "@type": "ItemList",
        itemListElement: READING_OFFERS.map((offer, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: offer.name,
          url: `${SITE_URL}/readings#${offer.slug}`,
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: visibleFaqs.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: { "@type": "Answer", text: faq.a },
      })),
    },
  ];

  return (
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "Readings", href: "/readings" }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* 1 — Hero */}
      <header className="pb-10">
        <Kicker className="mb-4">Personal video reading &middot; made for you</Kicker>
        <h1 className="type-display max-w-[44rem] text-brand-ink">
          One reading. Made for you.
        </h1>
        <p className="type-body-lg mt-6 max-w-[38em] text-brand-ink-soft">
          No calls, no appointments. Send a birth date at checkout — a
          personalized video reading arrives in your inbox within 48 hours.
        </p>
      </header>

      {/* 2 — The single pricing card */}
      <section id="pricing" className="mt-12">
        <Kicker>The reading</Kicker>
        <h2 className="type-h2 mt-4 text-brand-ink">The one offer.</h2>
        <div className="mt-8 mx-auto max-w-xl">
          <PricingCard offer={videoOffer} emphasized />
        </div>
        <div className="mt-6 space-y-1 text-center text-xs leading-relaxed text-brand-ink-soft">
          <p>{MICROTRUST_LINE}</p>
          <p>{VIDEO_DELIVERY_CLARIFIER}</p>
        </div>
      </section>

      {/* 3 — How it works */}
      <section className="mt-16">
        <Kicker>How it works</Kicker>
        <h2 className="type-h2 mt-4 text-brand-ink">From checkout to inbox.</h2>
        <div className="mt-6 grid gap-8 lg:grid-cols-3">
          {[
            {
              label: "01",
              title: "Check out with your birth date.",
              detail:
                "Stripe securely collects your email and payment, plus the birth date the reading is for — and your question, if you have one.",
            },
            {
              label: "02",
              title: "Your video is made for you.",
              detail:
                "A personal reading is written, voiced, and produced individually from your birth date and question — not generated live.",
            },
            {
              label: "03",
              title: "Watch your inbox.",
              detail:
                "A private video link arrives by email within 48 hours. It is yours to keep and rewatch.",
            },
          ].map((step) => (
            <div key={step.label} className="border-t border-brand-line pt-4">
              <p className="font-serif text-lg text-brand-bronze">{step.label}</p>
              <h3 className="type-h3 mt-2 text-brand-ink">{step.title}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-brand-ink-soft">{step.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4 — Delivery expectations */}
      <section className="mt-16 border-y border-brand-line py-8">
        <Kicker>Delivery</Kicker>
        <h2 className="type-h2 mt-4 text-brand-ink">Your email is the delivery address.</h2>
        <div className="mt-7 divide-y divide-brand-line border-y border-brand-line">
          {[
            {
              title: "Use an inbox you actually check.",
              detail:
                "The private video link goes to the email you enter at Stripe Checkout. That receipt email is also your refund and support thread.",
            },
            {
              title: "Nothing to schedule.",
              detail:
                "There is no call, no appointment, and no account. The reading comes to you — watch it when it lands, rewatch it whenever you need it.",
            },
            {
              title: "If 48 hours pass with no video.",
              detail: `Check spam and promotions first. If it is genuinely missing, email ${CONTACT_EMAIL} with your purchase email and we will make it right — including a full refund if the video was never delivered.`,
            },
          ].map((item) => (
            <div key={item.title} className="grid gap-2 py-5 sm:grid-cols-[minmax(0,15rem)_1fr] sm:gap-8">
              <h3 className="type-h3 text-brand-ink">{item.title}</h3>
              <p className="max-w-[38em] text-[0.95rem] leading-relaxed text-brand-ink-soft">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5 — Straight terms */}
      <section className="mt-16 border-t border-brand-line pt-8">
        <Kicker>Straight terms</Kicker>
        <div className="mt-5 max-w-[38em] space-y-4 text-[0.95rem] leading-relaxed text-brand-ink-soft">
          <p>
            One payment buys one personally-made video reading, delivered by
            email within 48 hours. {VIDEO_DELIVERY_COPY}
          </p>
          <p>
            Cardology is an esoteric reflection framework — not medical,
            legal, financial, or psychological advice, and no outcome is
            guaranteed. Read the{" "}
            <Link href="/terms-of-service" className="editorial-link text-brand-ink">
              terms of service
            </Link>{" "}
            or the{" "}
            <Link href="/refund-policy" className="editorial-link text-brand-ink">
              refund policy
            </Link>
            .
          </p>
        </div>
      </section>

      {/* 6 — FAQs */}
      <section className="mt-16 border-t border-brand-line pt-8">
        <h2 className="type-h2 text-brand-ink">Frequently asked questions</h2>
        <div className="mt-6 divide-y divide-brand-line">
          {visibleFaqs.map((faq) => (
            <div key={faq.q} className="py-5">
              <h3 className="type-h3 text-brand-ink">{faq.q}</h3>
              <p className="mt-2 max-w-[38em] text-[0.95rem] leading-relaxed text-brand-ink-soft">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 7 — Final CTA */}
      <section className="shell-ink mt-16 rounded-[3px] px-6 py-12 text-center sm:px-10 sm:py-16">
        <h2 className="type-h2">Your card is already waiting.</h2>
        <p className="mt-4 text-brand-on-dark-soft">
          One birth date at checkout. A personal video reading in your inbox
          within 48 hours.
        </p>
        <div className="mt-7">
          <LinkButton href={`/checkout/${videoOffer.slug}`} variant="accent" size="large">
            {videoOffer.cta}
          </LinkButton>
        </div>
        <p className="mt-5 text-sm text-brand-on-dark-soft">
          {MICROTRUST_LINE}
        </p>
      </section>

    </SeoShell>
  );
}
