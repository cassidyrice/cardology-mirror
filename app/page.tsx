import Link from "next/link";
import type { Metadata } from "next";

import { SiteFooter } from "@/components/seo/SiteFooter";
import { SiteHeader } from "@/components/seo/SiteHeader";
import { Kicker, LinkButton, PricingCard, SectionShell } from "@/components/ui";
import { MICROTRUST_LINE, VIDEO_DELIVERY_CLARIFIER } from "@/lib/offers";
import { READING_OFFERS, readingOfferHref } from "@/lib/products";
import { READINGS_PATH, SITE_URL } from "@/lib/site";

const videoOffer = READING_OFFERS[0];

export const metadata: Metadata = {
  title: { absolute: "Personal Video Cardology Readings | Card Blueprints" },
  description:
    "A personally-made Cardology video reading from your birth date, delivered to your inbox — plus a free birth card calculator, compatibility tools, and all 52 card meanings.",
  alternates: { canonical: "/" },
};

const FREE_PATHS = [
  {
    label: "Find Your Birth Card",
    href: "/birth-card-calculator",
    detail: "Enter a birthday and calculate the fixed birth card.",
  },
  {
    label: "Check Compatibility",
    href: "/birth-card-compatibility-calculator",
    detail: "Compare two birthdays and explore the relationship pattern.",
  },
];

const STEPS = [
  {
    label: "01",
    title: "Check out with your birth date.",
    detail: "Tell us the birth date the reading is for — and your question, if you have one.",
  },
  {
    label: "02",
    title: "Your video is made for you.",
    detail: "A personal reading is written, voiced, and produced individually — not generated live.",
  },
  {
    label: "03",
    title: "Watch your inbox.",
    detail: "A private video link arrives by email within 48 hours. Rewatch it anytime.",
  },
];

const LIBRARY_PATHS = [
  {
    intent: "I’m new to Cardology",
    detail: "Start with the calculation, then read how the system works.",
    links: [
      { label: "Birth Card Calculator", href: "/birth-card-calculator" },
      { label: "What Is Cardology?", href: "/what-is-cardology" },
    ],
  },
  {
    intent: "I know my card",
    detail: "Go deeper on your card’s pattern and the timing language around it.",
    links: [
      { label: "All 52 Card Meanings", href: "/birth-card" },
      { label: "Timing Resources", href: "/52-day-period-meaning-tool" },
    ],
  },
  {
    intent: "I’m exploring a relationship",
    detail: "Compare two birthdays and read the dynamic between the cards.",
    links: [
      { label: "Compatibility Calculator", href: "/birth-card-compatibility-calculator" },
      { label: "Compatibility Guide", href: "/cardology-compatibility" },
    ],
  },
];

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Card Blueprints video readings",
    itemListElement: READING_OFFERS.map((offer, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: offer.name,
      url: `${SITE_URL}${READINGS_PATH}#${offer.slug}`,
    })),
  };

  return (
    <div className="bg-brand-paper text-brand-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <SiteHeader />

      <main id="main-content" tabIndex={-1}>
        {/* 1 — Hero */}
        <section className="shell-paper">
        <div className="mx-auto w-full max-w-6xl px-5 pb-[clamp(4rem,8vw,7rem)] pt-[clamp(3.25rem,7vw,6rem)] sm:px-8 lg:px-10">
          <div className="max-w-[54rem]">
            <Kicker className="rise">Personal Cardology &middot; video readings</Kicker>
            <h1 className="type-display rise-2 mt-6">
              Send a birth date. Get back the <em>pattern</em>.
            </h1>
            <p className="type-body-lg rise-3 mt-7 max-w-[36em] text-brand-ink-soft">
              A personally-made Cardology video reading, built from the fixed
              card behind a birth date — for self-awareness around a
              relationship, a decision, or a season of life. Delivered to your
              inbox.
            </p>
            <div className="rise-4 mt-9 flex flex-col gap-3 sm:flex-row">
              <LinkButton href={readingOfferHref(videoOffer)} variant="accent" size="large">
                {videoOffer.cta}
              </LinkButton>
              <LinkButton href="/birth-card-calculator" variant="outline" size="large">
                Find Your Birth Card Free
              </LinkButton>
            </div>
            <p className="rise-4 mt-5 max-w-[38em] text-sm leading-relaxed text-brand-ink-soft">
              {MICROTRUST_LINE}
            </p>
            <p className="rise-4 mt-3 text-sm">
              <Link href="/try" className="editorial-link text-brand-ink">
                How the video reading works &rarr;
              </Link>
            </p>
            <p className="rise-4 mt-3 text-xs uppercase tracking-[0.14em] text-brand-ink-faint">
              Made for you &middot; fixed birth-card calculation &middot; reflection, not fortune-telling
            </p>
          </div>
        </div>
        </section>

      {/* 2 — Free entry points */}
      <SectionShell tone="paper" pad="small" className="border-t border-brand-line">
        <Kicker>Start free</Kicker>
        <h2 className="sr-only">Start free</h2>
        <div className="mt-6 divide-y divide-brand-line border-y border-brand-line">
          {FREE_PATHS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="group grid gap-1 py-6 transition hover:bg-brand-ivory sm:grid-cols-[minmax(0,18rem)_1fr_auto] sm:items-baseline sm:gap-6"
            >
              <FreeRowInner label={item.label} detail={item.detail} />
            </Link>
          ))}
        </div>
      </SectionShell>

      {/* 3 — The one paid offer */}
      <SectionShell tone="paperDeep" id="readings">
        <div className="max-w-[38em]">
          <Kicker>The reading</Kicker>
          <h2 className="type-h2 mt-4">One reading. Made for you.</h2>
          <p className="mt-5 leading-relaxed text-brand-ink-soft">
            No calls, no appointments. Your birth card and ruling card read as
            one pattern, your question woven through it — on video, so you can
            rewatch it whenever you need it.
          </p>
        </div>
        <div className="mt-10 mx-auto max-w-xl">
          <PricingCard offer={videoOffer} emphasized />
        </div>
        <div className="mt-8 space-y-1 text-center text-xs leading-relaxed text-brand-ink-soft">
          <p>{MICROTRUST_LINE}</p>
          <p>{VIDEO_DELIVERY_CLARIFIER}</p>
        </div>
      </SectionShell>

      {/* 4 — How it works */}
      <SectionShell tone="paper">
        <Kicker>How it works</Kicker>
        <h2 className="type-h2 mt-4">From checkout to inbox.</h2>
        <div className="mt-8 grid gap-10 lg:grid-cols-3 lg:gap-8">
          {STEPS.map((step) => (
            <div key={step.label} className="border-t border-brand-line pt-5">
              <p className="font-serif text-lg text-brand-bronze">{step.label}</p>
              <h3 className="type-h3 mt-3">{step.title}</h3>
              <p className="mt-3 max-w-[34em] text-[0.95rem] leading-relaxed text-brand-ink-soft">
                {step.detail}
              </p>
            </div>
          ))}
        </div>
      </SectionShell>

      {/* 5 — Method and trust */}
      <SectionShell tone="paperDeep">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
          <div>
            <Kicker>The method</Kicker>
            <h2 className="type-h2 mt-4">A real system under the symbols.</h2>
          </div>
          <div className="max-w-[38em] space-y-5 leading-relaxed text-brand-ink-soft lg:pt-2">
            <p>
              Cardology begins with a reproducible birth-card calculation: the
              same birthday produces the same card. The reading uses that
              structure as an esoteric reflection framework for people,
              relationships, and timing&mdash;not as scientific diagnosis or
              guaranteed prediction.
            </p>
            <p>
              Each video is written and voiced with AI and produced
              individually for the person who ordered it. The card math is
              fixed; the interpretation is generated&mdash;and the video says
              so.
            </p>
            <p>
              <Link href="/methodology" className="editorial-link text-brand-ink">
                Read the methodology &rarr;
              </Link>
            </p>
          </div>
        </div>
      </SectionShell>

      {/* 6 — Guided library pathways */}
      <SectionShell tone="paper">
        <Kicker>The library</Kicker>
        <h2 className="type-h2 mt-4">Explore the library.</h2>
        <div className="mt-8 divide-y divide-brand-line border-y border-brand-line">
          {LIBRARY_PATHS.map((path) => (
            <div
              key={path.intent}
              className="grid gap-3 py-7 lg:grid-cols-[minmax(0,18rem)_1fr] lg:gap-10"
            >
              <h3 className="type-h3">{path.intent}</h3>
              <div>
                <p className="max-w-[38em] text-[0.95rem] leading-relaxed text-brand-ink-soft">
                  {path.detail}
                </p>
                <p className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  {path.links.map((link) => (
                    <Link key={link.href} href={link.href} className="editorial-link text-brand-ink">
                      {link.label} &rarr;
                    </Link>
                  ))}
                </p>
              </div>
            </div>
          ))}
        </div>
      </SectionShell>

      {/* 7 — Condensed credibility */}
      <SectionShell tone="paperDeep" pad="small">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
          <div>
            <Kicker>Who&rsquo;s behind this</Kicker>
            <h2 className="type-h2 mt-4">Written from inside the system.</h2>
          </div>
          <div className="max-w-[38em] space-y-4 leading-relaxed text-brand-ink-soft lg:pt-2">
            <p>
              Cass was told at five years old that he was the Eight of Diamonds
              in the Crown Line.
            </p>
            <p>
              Decades inside the symbols followed, then years spent
              reverse-engineering the structure underneath them.
            </p>
            <p>
              The calculation is deterministic; the interpretation is a craft.
              This site keeps the two clearly separate.
            </p>
            <p>
              <Link href="/about" className="editorial-link text-brand-ink">
                About Card Blueprints &rarr;
              </Link>
            </p>
          </div>
        </div>
      </SectionShell>

      {/* 8 — Final CTA */}
        <SectionShell tone="ink">
        <div className="mx-auto max-w-[40rem] py-[clamp(1rem,4vw,3rem)] text-center">
          <h2 className="type-h2">Your card is already waiting.</h2>
          <p className="mt-5 text-brand-on-dark-soft">
            One birth date at checkout. A personal video reading in your inbox
            within 48 hours.
          </p>
          <div className="mt-8">
            <LinkButton href={readingOfferHref(videoOffer)} variant="accent" size="large">
              {videoOffer.cta}
            </LinkButton>
          </div>
          <p className="mt-4 text-sm">
            <Link href="/try" className="editorial-link text-brand-on-dark-soft">
              See how it works &rarr;
            </Link>
          </p>
        </div>
        </SectionShell>
      </main>

      {/* 9 — Footer */}
      <SiteFooter />

    </div>
  );
}

function FreeRowInner({ label, detail }: { label: string; detail: string }) {
  return (
    <>
      <h3 className="type-h3">{label}</h3>
      <p className="max-w-[38em] text-[0.95rem] leading-relaxed text-brand-ink-soft">{detail}</p>
      <span aria-hidden="true" className="hidden text-brand-bronze sm:block">
        &rarr;
      </span>
    </>
  );
}
