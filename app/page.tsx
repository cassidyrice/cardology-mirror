import Link from "next/link";
import type { Metadata } from "next";

import { FreeCourseCta } from "@/components/free-course/FreeCourseCta";
import { HomepageCalculatorHero } from "@/components/home/HomepageCalculatorHero";
import { SiteFooter } from "@/components/seo/SiteFooter";
import { SiteHeader } from "@/components/seo/SiteHeader";
import { Kicker, LinkButton, SectionShell } from "@/components/ui";
import {
  DEEP_DIVE_CALCULATOR_FORM_HREF,
  DEEP_DIVE_CTA_LABEL,
  DEEP_DIVE_PRICE_LABEL,
} from "@/lib/deep-dive";
import { DEEP_DIVE_PRODUCT, INSTANT_REPORT_PRODUCTS } from "@/lib/products";
import {
  BIRTHDAY_DIRECTORY_PATH,
  COMPATIBILITY_DIRECTORY_PATH,
  SITE_URL,
} from "@/lib/site";

const HOME_TITLE = "Cardology Birth Cards, Chart & Calculator | Card Blueprints";
const HOME_DESCRIPTION =
  "Find your playing-card birth card free (not tarot). Same birthday, same card. Optional $9 Deep Dive PDF with your card written out.";

export const metadata: Metadata = {
  title: { absolute: HOME_TITLE },
  description: HOME_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: "/",
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Card Blueprints — your birth card as a mirror" }],
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: ["/og/default.png"],
  },
};

const FREE_PATHS = [
  {
    label: "Check Compatibility Free",
    href: "/birth-card-compatibility-calculator",
    detail: "Compare two birthdays and explore the relationship pattern.",
    external: false,
  },
  {
    label: "Browse birthdays by date",
    href: BIRTHDAY_DIRECTORY_PATH,
    detail: "Look up any birthday in the full Cardology calendar (366 dates).",
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
    title: "Enter your birthday.",
    detail: "The free calculator maps it to one playing card. Calculated on this page — your birthday is never stored.",
  },
  {
    label: "02",
    title: "Read your card.",
    detail: "You get the birth card and ruling card on the spot — free, no email required.",
  },
  {
    label: "03",
    title: "Optional: the $9 Deep Dive.",
    detail: "Seven pages on your card, plus the complete System Guide. Instant download links and an email backup.",
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
  const paidOffers = [DEEP_DIVE_PRODUCT, ...INSTANT_REPORT_PRODUCTS];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Card Blueprints paid writes",
    itemListElement: paidOffers.map((offer, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: offer.name,
      url: `${SITE_URL}${offer.href ?? `/products/${offer.slug}`}`,
    })),
  };

  return (
    <div className="bg-brand-paper text-brand-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <SiteHeader />

      <main id="main-content" tabIndex={-1}>
        {/* 1 — Calculator-first hero */}
        <HomepageCalculatorHero />

      {/* 2 — How it works (calculator → $9 Deep Dive) */}
      <SectionShell tone="paper">
        <Kicker>How it works</Kicker>
        <h2 className="type-h2 mt-4">From birthday to Deep Dive.</h2>
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

      {/* 3 — More free entry points */}
      <SectionShell tone="paper" pad="small" className="border-t border-brand-line">
        <Kicker>Keep exploring · no account</Kicker>
        <h2 className="type-h3 mt-3 max-w-[28rem] text-brand-ink">
          Compare, browse, or learn the system.
        </h2>
        <div className="mt-6 divide-y divide-brand-line border-y border-brand-line">
          {FREE_PATHS.map((item) =>
            item.external ? (
              <a
                key={item.label}
                href={item.href}
                aria-label={`${item.label}. ${item.detail}`}
                className="group grid gap-1 py-6 transition hover:bg-brand-ivory sm:grid-cols-[minmax(0,18rem)_1fr_auto] sm:items-baseline sm:gap-6"
              >
                <FreeRowInner label={item.label} detail={item.detail} />
              </a>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                aria-label={`${item.label}. ${item.detail}`}
                className="group grid gap-1 py-6 transition hover:bg-brand-ivory sm:grid-cols-[minmax(0,18rem)_1fr_auto] sm:items-baseline sm:gap-6"
              >
                <FreeRowInner label={item.label} detail={item.detail} />
              </Link>
            ),
          )}
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

      {/* 8 — Paid writes (Deep Dive primary, Blueprint secondary) */}
      <SectionShell tone="paperDeep">
        <Kicker>Written reports</Kicker>
        <h2 className="type-h2 mt-4">Two paid writes. One free card name.</h2>
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="border-t border-brand-line pt-5">
            <p className="type-eyebrow text-brand-oxblood">Primary</p>
            <h3 className="type-h3 mt-2">Birth Card Deep Dive — {DEEP_DIVE_PRICE_LABEL}</h3>
            <p className="mt-3 max-w-[34em] text-[0.95rem] leading-relaxed text-brand-ink-soft">
              Your card, 7 pages, plus the complete System Guide.
            </p>
            <figure className="mt-4 max-w-[34em]">
              <blockquote className="text-[0.95rem] leading-relaxed text-brand-ink-soft">
                &ldquo;I bought the Deep Dive, found out I was the Five of Clubs, and a lot of my life stopped looking random.&rdquo;
              </blockquote>
              <figcaption className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-bronze">
                <span aria-label="5 out of 5 stars" className="mr-2 tracking-normal">★★★★★</span>
                Tiffany, 37 · Five of Clubs
              </figcaption>
            </figure>
            <p className="mt-5">
              <LinkButton href={DEEP_DIVE_CALCULATOR_FORM_HREF} variant="accent">
                {DEEP_DIVE_CTA_LABEL}
              </LinkButton>
            </p>
            <p className="mt-3 text-sm text-brand-ink-soft">
              Need the card first? Use the calculator above.
            </p>
          </div>
                  </div>
      </SectionShell>

      {/* 9 — Final CTA */}
        <SectionShell tone="ink">
        <div className="mx-auto max-w-[40rem] py-[clamp(1rem,4vw,3rem)] text-center">
          <h2 className="type-h2">Find the card first.</h2>
          <p className="mt-5 text-brand-on-dark-soft">
            Reveal your birth card free. The $9 Deep Dive is there if you want it written down.
          </p>
          <div className="mt-8">
            <LinkButton href="#home-birthdate" variant="accent" size="large">
              Reveal my birth card
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
