import type { Metadata } from "next";
import Link from "next/link";

import { BirthCardCalculator } from "@/components/seo/BirthCardCalculator";
import { ReadingBridge } from "@/components/seo/ReadingBridge";
import { SeoShell } from "@/components/seo/SeoShell";
import { Kicker } from "@/components/ui";
import { buildProductJsonLd } from "@/lib/product-schema";
import { digitalBySlug } from "@/lib/products";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "The Analog Algorithm — E-book | Card Blueprints",
  description:
    "The Analog Algorithm: why a deck of 52 cards maps to a solar year. A full-length handbook with birth card mechanics, yearly spreads, planetary periods, and practice worksheets. $17 — instant PDF download.",
  alternates: { canonical: "/products/analog-algorithm" },
  openGraph: {
    title: "The Analog Algorithm — your birthday, decoded. The written system.",
    description:
      "The 52-card solar calendar, fully explained. Birth card formula, spreads, planetary periods, worksheets. Instant PDF download — $17.",
    type: "website",
    siteName: SITE_NAME,
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: SITE_NAME }],
  },
};

const book = digitalBySlug("analog-algorithm")!;

export default function AnalogAlgorithmSalesPage() {
  if (!book) return null;

  return (
    <SeoShell
      crumb={[
        { label: "Home", href: "/" },
        { label: "The Analog Algorithm", href: book.href! },
      ]}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildProductJsonLd(book)) }}
      />
      {/* Hero */}
      <header className="max-w-[42rem] pb-10">
        <Kicker className="mb-4">
          <span className="r" aria-hidden="true">♥</span> ♣{" "}
          <span className="r" aria-hidden="true">♦</span> ♠ — E-book
        </Kicker>
        <h1 className="type-display text-brand-ink">
          The Analog Algorithm
        </h1>
        <p className="type-body-lg mt-5 text-brand-ink-soft">
          Why a deck of 52 cards maps to a solar year — and how to use that
          calendar. A full-length handbook with the birth card formula,
          yearly spreads, planetary periods, and practice worksheets.
        </p>
        <div className="mt-6">
          <Link
            href={`/checkout/${book.slug}`}
            className="accent-button large-button inline-flex"
          >
            Get the E-book — {book.priceLabel}
          </Link>
        </div>
        <p className="mt-3 text-sm text-brand-ink-soft">
          One-time purchase. Secure PDF download after payment. No subscription.
        </p>
      </header>

      {/* What's inside */}
      <section
        aria-labelledby="inside"
        className="border-y border-brand-line py-10"
      >
        <h2 id="inside" className="type-h2 text-brand-ink">
          What&rsquo;s inside
        </h2>
        <p className="mt-2 text-sm text-brand-ink-soft">
          ~80 pages. Claim-labelled so you know what&rsquo;s verified and
          what&rsquo;s speculative.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="font-serif text-lg text-brand-bronze">
              Part I — The Hook
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-brand-ink-soft">
              <li>How to read claim labels</li>
              <li>The 52-card / 52-week riddle</li>
              <li>Algorithm vs fortune-telling</li>
            </ul>
          </div>
          <div>
            <h3 className="font-serif text-lg text-brand-bronze">
              Part II — The Algorithm{" "}
              <span className="text-xs text-brand-ink-soft">
                (verified)
              </span>
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-brand-ink-soft">
              <li>Solar value formula + birth card</li>
              <li>Year 0 state machine + spreads</li>
              <li>90-year fixed permutation</li>
              <li>52-day planetary periods</li>
              <li>Environment, displacement, Long Range</li>
              <li>Full worked examples</li>
            </ul>
          </div>
          <div>
            <h3 className="font-serif text-lg text-brand-bronze">
              Part III — Reading the Output{" "}
              <span className="text-xs text-brand-ink-soft">
                (interpretive)
              </span>
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-brand-ink-soft">
              <li>Number × Suit × Planet grammar</li>
              <li>Under / Sweet Spot / Over spectrum</li>
              <li>Relationship dynamics (no scorecards)</li>
              <li>Ethics and honest limits</li>
            </ul>
          </div>
          <div>
            <h3 className="font-serif text-lg text-brand-bronze">
              Part IV — Practice Appendices
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-brand-ink-soft">
              <li>52-card quick reference</li>
              <li>Fill-in worksheets</li>
              <li>Blank spread templates</li>
              <li>One-page formula sheet</li>
              <li>Glossary + further study</li>
            </ul>
          </div>
        </div>
      </section>

      {/* How it relates */}
      <section className="border-b border-brand-line py-10">
        <h2 className="type-h2 text-brand-ink">
          The system behind your Personal Card Blueprint
        </h2>
        <p className="mt-2 max-w-[42rem] text-sm leading-relaxed text-brand-ink-soft">
          The same deterministic system that powers the{" "}
          <Link
            href="/products/personal-card-blueprint"
            className="editorial-link text-brand-ink"
          >
            Personal Card Blueprint
          </Link>{" "}
          is explained here in full. The e-book teaches <em>why</em> and{" "}
          <em>how</em>; the Blueprint applies the pattern to your birthday.
          The free tools let you explore the system before deciding whether you
          want a personalized Blueprint.
        </p>
      </section>

      {/* Sample: birth card calculator */}
      <section className="border-b border-brand-line py-10">
        <h2 className="type-h2 text-brand-ink">
          Try your birth card — free
        </h2>
        <p className="mt-2 max-w-[42rem] text-sm leading-relaxed text-brand-ink-soft">
          The calculator below uses the same formula described in Chapter 4
          of the book. Enter a birthday to see the solar value and your
          birth card.
        </p>
        <div className="mt-6">
          <BirthCardCalculator />
        </div>
      </section>

      {/* CTA repeat */}
      <section className="py-10 text-center">
        <Link
          href={`/checkout/${book.slug}`}
          className="accent-button large-button inline-flex"
        >
          Get the E-book — {book.priceLabel}
        </Link>
        <p className="mt-3 text-xs text-brand-ink-soft">
          One-time purchase. Secure download link by email and on the confirmation page.
        </p>
        <p className="mt-4 text-sm text-brand-ink-soft">
          <Link
            href="/products/personal-card-blueprint"
            className="editorial-link text-brand-ink"
          >
            Get your Personal Card Blueprint &rarr;
          </Link>
        </p>
      </section>

      {/* FAQ */}
      <section className="border-t border-brand-line py-10">
        <h2 className="type-h2 text-brand-ink">FAQ</h2>

        <details className="mt-6 border-t border-brand-line pt-5">
          <summary className="cursor-pointer font-serif text-lg text-brand-ink">
            Is this a physical book?
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-brand-ink-soft">
            No — The Analog Algorithm is a PDF e-book delivered instantly
            after purchase. You get a secure download link by email, good
            for 30 days. Print it at home if you like; the pages are
            letter-sized.
          </p>
        </details>

        <details className="mt-4 border-t border-brand-line pt-5">
          <summary className="cursor-pointer font-serif text-lg text-brand-ink">
            Do I need to know Cardology first?
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-brand-ink-soft">
            No. Chapter 1 starts from zero. The book is written for smart
            beginners — if you can do a little arithmetic, you can follow
            the algorithm. Footnotes and sidebars cover the deeper
            mathematical structure for readers who want it.
          </p>
        </details>

        <details className="mt-4 border-t border-brand-line pt-5">
          <summary className="cursor-pointer font-serif text-lg text-brand-ink">
            Does this replace the Personal Card Blueprint?
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-brand-ink-soft">
            It complements it. The e-book explains the system; the Personal
            Card Blueprint applies that pattern to your birthday in an instant
            personalized report. You don&rsquo;t need one product to use another.
          </p>
        </details>

        <details className="mt-4 border-t border-brand-line pt-5">
          <summary className="cursor-pointer font-serif text-lg text-brand-ink">
            Can I get a refund?
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-brand-ink-soft">
            Digital goods with instant download are refundable only if the
            file is corrupt or the download fails. See the{" "}
            <Link
              href="/refund-policy"
              className="editorial-link text-brand-ink"
            >
              refund policy
            </Link>{" "}
            for details.
          </p>
        </details>
      </section>

      {/* Reading bridge */}
      <ReadingBridge variant="general" />

      {/* Disclaimer */}
      <footer className="mt-12 border-t border-brand-line pt-8 text-xs text-brand-ink-soft">
        <p>
          Cardology readings and interpretations are for entertainment
          and self-reflection purposes. They are not a substitute for
          professional medical, psychological, legal, or financial advice.
        </p>
      </footer>
    </SeoShell>
  );
}