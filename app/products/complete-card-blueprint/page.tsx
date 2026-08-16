import type { Metadata } from "next";
import Link from "next/link";

import { ReadingBridge } from "@/components/seo/ReadingBridge";
import { SeoShell } from "@/components/seo/SeoShell";
import { Kicker } from "@/components/ui";
import { digitalBySlug } from "@/lib/products";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "The Complete Card Blueprint — Handbook | Card Blueprints",
  description:
    "The Complete Card Blueprint: the full working system of birth cards, timing, relationships, and all 52 entries. A 141-page handbook. $27 — PDF download.",
  alternates: { canonical: "/products/complete-card-blueprint" },
  openGraph: {
    title: "The Complete Card Blueprint — the full working system.",
    description:
      "Birth cards, timing, relationships, and all 52 entries in one handbook. PDF download — $27.",
    type: "website",
    siteName: SITE_NAME,
    images: [{ url: "/og-default.png" }],
  },
};

const book = digitalBySlug("complete-card-blueprint")!;

export default function CompleteCardBlueprintSalesPage() {
  if (!book) return null;

  return (
    <SeoShell
      crumb={[
        { label: "Home", href: "/" },
        { label: "The Complete Card Blueprint", href: book.href! },
      ]}
    >
      <header className="max-w-[42rem] pb-10">
        <Kicker className="mb-4">
          <span className="r" aria-hidden="true">
            ♥
          </span>{" "}
          ♣{" "}
          <span className="r" aria-hidden="true">
            ♦
          </span>{" "}
          ♠ — Handbook
        </Kicker>
        <h1 className="type-display text-brand-ink">The Complete Card Blueprint</h1>
        <p className="type-body-lg mt-5 text-brand-ink-soft">
          The full working system of birth cards, timing, relationships, and the
          living deck. A handbook that sits beside The Analog Algorithm — same
          tokens, a quieter cover, the entire method in one file.
        </p>
        <div className="mt-6">
          <Link
            href={`/checkout/${book.slug}`}
            className="accent-button large-button inline-flex"
          >
            Get the Handbook — {book.priceLabel}
          </Link>
        </div>
        <p className="mt-3 text-sm text-brand-ink-soft">
          One-time purchase. Secure PDF download after payment. No subscription.
        </p>
      </header>

      <section aria-labelledby="inside" className="border-y border-brand-line py-10">
        <h2 id="inside" className="type-h2 text-brand-ink">
          What&rsquo;s inside
        </h2>
        <p className="mt-2 text-sm text-brand-ink-soft">
          141 letter-sized pages. Claim-labelled so verified mechanics stay
          separate from interpretive language.
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="font-serif text-lg text-brand-bronze">How to use + the pattern</h3>
            <ul className="mt-2 space-y-1 text-sm text-brand-ink-soft">
              <li>Three routes: calculate, time, relate</li>
              <li>What Cardology is and is not</li>
              <li>52-card calendar structure</li>
            </ul>
          </div>
          <div>
            <h3 className="font-serif text-lg text-brand-bronze">Core pattern + reading</h3>
            <ul className="mt-2 space-y-1 text-sm text-brand-ink-soft">
              <li>Birth-card calculation and calendar boundaries</li>
              <li>Rank × suit × planet grammar</li>
              <li>Under / sweet / over as states, not types</li>
            </ul>
          </div>
          <div>
            <h3 className="font-serif text-lg text-brand-bronze">Timing + relationships</h3>
            <ul className="mt-2 space-y-1 text-sm text-brand-ink-soft">
              <li>Life Spread and seven planetary periods</li>
              <li>52-day timing with Neptune remainder</li>
              <li>Two cards, four questions, no score</li>
            </ul>
          </div>
          <div>
            <h3 className="font-serif text-lg text-brand-bronze">Library + practice</h3>
            <ul className="mt-2 space-y-1 text-sm text-brand-ink-soft">
              <li>All 52 entries on one template</li>
              <li>Worksheets and formula sheet</li>
              <li>Glossary, legal, methodology notes</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="border-b border-brand-line py-10">
        <h2 className="type-h2 text-brand-ink">Beside The Analog Algorithm</h2>
        <p className="mt-2 max-w-[42rem] text-sm leading-relaxed text-brand-ink-soft">
          <Link href="/products/analog-algorithm" className="editorial-link text-brand-ink">
            The Analog Algorithm
          </Link>{" "}
          proves the engine. This handbook is the working companion: how to
          read a card, time a year, compare two cards, and look up all 52. You
          do not need one product to use the other.
        </p>
      </section>

      <section className="py-10 text-center">
        <Link
          href={`/checkout/${book.slug}`}
          className="accent-button large-button inline-flex"
        >
          Get the Handbook — {book.priceLabel}
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

      <section className="border-t border-brand-line py-10">
        <h2 className="type-h2 text-brand-ink">FAQ</h2>
        <details className="mt-6 border-t border-brand-line pt-5">
          <summary className="cursor-pointer font-serif text-lg text-brand-ink">
            Is this a physical book?
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-brand-ink-soft">
            No. It is a PDF handbook delivered after purchase. Print it at home
            if you like; the pages are letter-sized.
          </p>
        </details>
        <details className="mt-4 border-t border-brand-line pt-5">
          <summary className="cursor-pointer font-serif text-lg text-brand-ink">
            Do I need The Analog Algorithm first?
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-brand-ink-soft">
            No. This book stands alone. Analog Algorithm is the engine proof;
            this is the full working system.
          </p>
        </details>
        <details className="mt-4 border-t border-brand-line pt-5">
          <summary className="cursor-pointer font-serif text-lg text-brand-ink">
            Can I get a refund?
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-brand-ink-soft">
            Digital goods with download access are refundable only if the file
            is corrupt or the download fails. See the{" "}
            <Link href="/refund-policy" className="editorial-link text-brand-ink">
              refund policy
            </Link>
            .
          </p>
        </details>
      </section>

      <ReadingBridge variant="general" />

      <footer className="mt-12 border-t border-brand-line pt-8 text-xs text-brand-ink-soft">
        <p>
          Cardology readings and interpretations are for entertainment and
          self-reflection. They are not a substitute for professional medical,
          psychological, legal, or financial advice.
        </p>
      </footer>
    </SeoShell>
  );
}
