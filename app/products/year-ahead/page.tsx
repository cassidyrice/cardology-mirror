import type { Metadata } from "next";
import Link from "next/link";

import { DeepDiveCta } from "@/components/seo/DeepDiveCta";
import { SeoHeroFan } from "@/components/seo/SeoHeroFan";
import { SeoShell } from "@/components/seo/SeoShell";
import { YearAheadCta } from "@/components/seo/YearAheadCta";
import { DEEP_DIVE_PRODUCT_NAME, DEEP_DIVE_PRICE_LABEL, DEEP_DIVE_REVIEW_PATH } from "@/lib/deep-dive";
import { buildProductJsonLd } from "@/lib/product-schema";
import { YEAR_AHEAD_PRODUCT } from "@/lib/products";
import { SITE_NAME } from "@/lib/site";
import { YEAR_AHEAD_SAMPLE } from "@/lib/year-ahead-sample";
import {
  YEAR_AHEAD_PRICE_LABEL,
  YEAR_AHEAD_PRODUCT_NAME,
  YEAR_AHEAD_PRODUCT_PATH,
  yearAheadPriceId,
} from "@/lib/year-ahead";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const TITLE = `${YEAR_AHEAD_PRODUCT_NAME} · ${YEAR_AHEAD_PRICE_LABEL} · your card year, birthday to birthday`;
const DESCRIPTION =
  `Cardology ${YEAR_AHEAD_PRODUCT_NAME} for ${YEAR_AHEAD_PRICE_LABEL}: your Long Range card, your Pluto card and its Result, and all seven 52-day periods of your card year, dated. Ready the moment you pay. A mirror, not a forecast.`;
const OG_IMAGE = "/og/default.png";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "cardology year ahead",
    "cardology yearly spread",
    "cardology long range card",
    "cardology pluto card",
    "52 day periods",
    "birth card year reading",
  ],
  alternates: { canonical: YEAR_AHEAD_PRODUCT_PATH },
  openGraph: {
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    url: YEAR_AHEAD_PRODUCT_PATH,
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Your Year Ahead, $19. Your card year, birthday to birthday." }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

const faqs = [
  {
    q: "What do I get for $19?",
    a: "Your card year, birthday to birthday, built from your birth card. This year's Long Range card and where you sit in its seven-year cycle. This year's Pluto card, what the year asks of you, and its Result, what it pays. All seven 52-day periods, dated, with the card for each and a light, a shadow, and one small dare. The period you are in right now and the one coming next. And the year's Environment and Displacement cards.",
  },
  {
    q: "How fast does it arrive?",
    a: "The moment you pay. It opens on the page you land on after checkout, and the link is emailed to you. The link works for 12 months, so you can come back each time a new period starts.",
  },
  {
    q: "Which year is it?",
    a: "The card year you are in now. A Cardology year runs from one birthday to the day before the next, not January to December. If your birthday was in March, your year runs March to March.",
  },
  {
    q: "Is this written by a person or a model?",
    a: "Neither, on the day. The cards come from the same fixed arithmetic as the free calculator: same birthday, same cards, every time, and you can check the math. The words for each card and each period come from a reviewed library written ahead of time. Nothing is generated on the fly.",
  },
  {
    q: "Will it tell me what happens this year?",
    a: "No. It is a mirror, not a forecast. It shows which cards sit over each stretch of your year and what each one tends to press on. What you do with that is yours.",
  },
  {
    q: "What about December 31?",
    a: "December 31 is the Joker, the one birthday outside the 52-card map, so there is no card year to lay out. Checkout refuses that date before any payment.",
  },
];

export default function YearAheadPage() {
  // Fail closed: until the Stripe price secret exists, no buy button.
  const onSale = Boolean(yearAheadPriceId());
  const jsonLd = [
    buildProductJsonLd(YEAR_AHEAD_PRODUCT),
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];
  const s = YEAR_AHEAD_SAMPLE;

  return (
    <SeoShell
      crumb={[
        { label: "Home", href: "/" },
        { label: YEAR_AHEAD_PRODUCT_NAME, href: YEAR_AHEAD_PRODUCT_PATH },
      ]}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <SeoHeroFan codes={["9♦", "9♥", "3♣"]} className="mb-5" />
      <p className="type-eyebrow mb-3 !text-brand-bronze">Cardology</p>
      <h1 className="display mb-3 text-3xl text-brand-ink sm:text-4xl">
        {YEAR_AHEAD_PRODUCT_NAME}
        <span className="mt-2 block font-sans text-base font-medium leading-snug tracking-normal text-brand-ink-soft">
          {YEAR_AHEAD_PRICE_LABEL} · ready the moment you pay · a mirror, not a forecast
        </span>
      </h1>
      <p className="prose-reading mb-6 max-w-[38em] text-brand-ink-soft">
        You found your card. This is what this year of it looks like. Your card
        year runs birthday to birthday, and it has a shape: one card over the
        whole year, one card pushing on you, one card it pays out, and seven
        52-day periods in a row, each with its own card. You get all of it,
        dated, in plain words.
      </p>

      <p className="mb-4 max-w-[38em] text-sm text-brand-ink-soft">
        Don&rsquo;t know your card yet?{" "}
        <Link href="/birth-card-calculator" className="font-medium text-brand-oxblood underline underline-offset-4">
          Find your birth card free
        </Link>
        . Your year is built from that birthday.
      </p>

      <div className="mb-10 flex max-w-md flex-col items-start gap-3">
        {onSale ? (
          <YearAheadCta placement="product-page" />
        ) : (
          <p className="text-sm font-semibold text-brand-ink">Checkout opens soon.</p>
        )}
        <p className="text-sm text-brand-ink-soft">
          You confirm your birthday on the next page, then pay {YEAR_AHEAD_PRICE_LABEL} on Stripe.
        </p>
      </div>

      <section className="mt-10">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">What your year is made of</h2>
        <p className="prose-reading text-brand-ink-soft">
          Your birth card, light and shadow. This year&rsquo;s Long Range card,
          the card over the whole year, and which of its seven years you are in.
          This year&rsquo;s Pluto card, the thing the year keeps dragging you to
          change, and its Result, what you get if you don&rsquo;t flinch. Then
          the seven 52-day periods, Mercury through Neptune, each with its dates,
          its card, and one small dare. The period you are in now is marked. The
          year&rsquo;s Environment and Displacement cards close it out.
        </p>
      </section>

      <section id="sample" className="mt-10">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">A real one</h2>
        <p className="mb-4 text-sm text-brand-ink-soft">
          The cards for a {s.birthCard} born March 14 (a made-up birthday), card
          year {s.yearRange}.
        </p>
        <div className="border-l-2 border-brand-line pl-5">
          <p className="prose-reading text-brand-ink">
            Long Range: <strong>{s.longRange}</strong>, year {s.yearInCycle} of 7.
            Pluto: <strong>{s.pluto}</strong>. Result: <strong>{s.result}</strong>.
          </p>
          <ol className="mt-4 space-y-1 text-sm text-brand-ink">
            {s.periods.map((p) => (
              <li key={p.planet} className="grid grid-cols-[5.5rem_1fr] gap-2">
                <span className="font-semibold">{p.planet}</span>
                <span>
                  {p.card} <span className="text-brand-ink-soft">· {p.range}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="prose-reading mt-4 text-brand-ink-soft">
            Each line opens into the card&rsquo;s light, its shadow, and one
            small dare for those 52 days.
          </p>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">How it works</h2>
        <p className="prose-reading text-brand-ink-soft">
          You confirm your birth date and pay {YEAR_AHEAD_PRICE_LABEL} on Stripe.
          Your cards are pulled the same way the free calculator pulls them: same
          birthday, same cards, every time. Your year opens on the next page and
          the link lands in your inbox. It works for 12 months, so you can come
          back each time a period turns over.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">What it is not</h2>
        <p className="prose-reading text-brand-ink-soft">
          A mirror, not a forecast. It will not tell you what happens or when.
          It shows which card sits over each stretch of your year and what that
          card tends to press on.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">Got one specific question instead?</h2>
        <p className="prose-reading text-brand-ink-soft">
          The {DEEP_DIVE_PRODUCT_NAME} ({DEEP_DIVE_PRICE_LABEL}) reads one question
          you are deciding from your birth card and this year.
        </p>
        <div className="mt-4 max-w-md">
          <DeepDiveCta placement="year-ahead-page" source="product-page" showFulfillment={false} href={DEEP_DIVE_REVIEW_PATH} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="type-eyebrow mb-4 !text-brand-bronze">Questions people ask first</h2>
        <div className="space-y-4">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-2xl border border-brand-line bg-brand-ivory/70 p-4">
              <h3 className="font-serif text-lg text-brand-ink">{f.q}</h3>
              <p className="prose-reading mt-2 text-sm text-brand-ink-soft">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {onSale ? (
        <div className="mt-10 max-w-md">
          <YearAheadCta placement="product-page-bottom" />
        </div>
      ) : null}
    </SeoShell>
  );
}
