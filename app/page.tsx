import Link from "next/link";
import type { Metadata } from "next";

import { FreeCourseCta } from "@/components/free-course/FreeCourseCta";
import { HomepageJourney } from "@/components/home/HomepageJourney";
import { SiteFooter } from "@/components/seo/SiteFooter";
import { SiteHeader } from "@/components/seo/SiteHeader";
import { Kicker, LinkButton, SectionShell } from "@/components/ui";
import { INSTANT_REPORT_PRODUCTS } from "@/lib/products";
import {
  BIRTHDAY_DIRECTORY_PATH,
  COMPATIBILITY_DIRECTORY_PATH,
  SITE_URL,
} from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "Card Blueprints | Birth Cards, Calculator & Cardology" },
  description:
    "Find your birth card free, explore Cardology meanings and compatibility, and get an instant Personal Card Blueprint from your birthday.",
  alternates: { canonical: "/" },
};

const FREE_PATHS = [
  {
    label: "Find Your Birth Card Free",
    href: "/birth-card-calculator",
    detail: "Enter a birthday — fixed playing-card birth card, not tarot.",
    external: false,
  },
  {
    label: "Check Compatibility Free",
    href: "/birth-card-compatibility-calculator",
    detail: "Compare two birthdays and explore the relationship pattern.",
    external: false,
  },
  {
    label: "Browse birthdays by date",
    href: BIRTHDAY_DIRECTORY_PATH,
    detail: "Look up any birthday in the full 366-day birth card calendar.",
    external: true,
  },
  {
    label: "New to Cardology?",
    href: "/cardology-for-beginners",
    detail: "Ten-minute beginner path from first card to first comparison.",
    external: false,
  },
];

const STEPS = [
  {
    label: "01",
    title: "Enter your birth date.",
    detail: "Stripe securely collects the birthday your Blueprint should use.",
  },
  {
    label: "02",
    title: "Complete one-time checkout.",
    detail: "The Personal Card Blueprint is $29 with no subscription or renewal.",
  },
  {
    label: "03",
    title: "Open your report instantly.",
    detail: "Your personalized report appears after payment and a return link is emailed to you.",
  },
];

const LIBRARY_PATHS = [
  {
    intent: "I’m new to Cardology",
    detail: "Start with the calculation, then read how the system works.",
    links: [
      { label: "Birth Card Calculator", href: "/birth-card-calculator" },
      { label: "Cardology for Beginners", href: "/cardology-for-beginners" },
      { label: "What Is Cardology?", href: "/what-is-cardology" },
      { label: "Cardology vs Tarot", href: "/cardology-vs-tarot" },
    ],
  },
  {
    intent: "I know my card",
    detail: "Go deeper on your card’s pattern and the timing language around it.",
    links: [
      { label: "All 52 Card Meanings", href: "/birth-card" },
      { label: "Birthdays by Date", href: BIRTHDAY_DIRECTORY_PATH },
      { label: "Timing Resources", href: "/52-day-period-meaning-tool" },
    ],
  },
  {
    intent: "I’m exploring a relationship",
    detail: "Compare two birthdays and read the dynamic between the cards.",
    links: [
      { label: "Compatibility Calculator", href: "/birth-card-compatibility-calculator" },
      { label: "All Card Pairings", href: COMPATIBILITY_DIRECTORY_PATH },
      { label: "Compatibility Guide", href: "/cardology-compatibility" },
    ],
  },
];

export default function Home() {
  const paidOffers = INSTANT_REPORT_PRODUCTS;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Card Blueprints paid product",
    itemListElement: paidOffers.map((offer, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: offer.name,
      url: `${SITE_URL}/products/${offer.slug}`,
    })),
  };

  return (
    <div className="bg-brand-paper text-brand-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <SiteHeader />

      <main id="main-content" tabIndex={-1}>
        {/* 1 — Cinematic scroll journey */}
        <HomepageJourney />

      {/* 2 — Free entry points (secondary path next to Blueprint hero) */}
      <SectionShell tone="paper" pad="small" className="border-t border-brand-line">
        <Kicker>Start free · no account</Kicker>
        <h2 className="type-h3 mt-3 max-w-[28rem] text-brand-ink">
          Find your card before you buy anything.
        </h2>
        <div className="mt-6 divide-y divide-brand-line border-y border-brand-line">
          {FREE_PATHS.map((item) =>
            item.external ? (
              <a
                key={item.label}
                href={item.href}
                className="group grid gap-1 py-6 transition hover:bg-brand-ivory sm:grid-cols-[minmax(0,18rem)_1fr_auto] sm:items-baseline sm:gap-6"
              >
                <FreeRowInner label={item.label} detail={item.detail} />
              </a>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                className="group grid gap-1 py-6 transition hover:bg-brand-ivory sm:grid-cols-[minmax(0,18rem)_1fr_auto] sm:items-baseline sm:gap-6"
              >
                <FreeRowInner label={item.label} detail={item.detail} />
              </Link>
            ),
          )}
        </div>
      </SectionShell>

      {/* 3 — How it works */}
      <SectionShell tone="paper">
        <Kicker>How it works</Kicker>
        <h2 className="type-h2 mt-4">From birthday to Blueprint.</h2>
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

      <SectionShell tone="ink">
        <FreeCourseCta source="home" variant="home" />
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
                  {path.links.map((link) =>
                    link.href.startsWith("/born-on") || link.href.startsWith("/compatibility") ? (
                      <a key={link.href} href={link.href} className="editorial-link text-brand-ink">
                        {link.label} &rarr;
                      </a>
                    ) : (
                      <Link key={link.href} href={link.href} className="editorial-link text-brand-ink">
                        {link.label} &rarr;
                      </Link>
                    ),
                  )}
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
          <h2 className="type-h2">Your pattern is ready to be written.</h2>
          <p className="mt-5 text-brand-on-dark-soft">
            Get your birth card, ruling layer, current chapter, and reflection prompts in one instant report.
          </p>
          <div className="mt-8">
            <LinkButton href="/products/personal-card-blueprint" variant="accent" size="large">
              Get My Blueprint — $29
            </LinkButton>
          </div>
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
