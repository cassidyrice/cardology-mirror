import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Cardology Methodology: How Birth Cards Are Calculated",
  description:
    "How Cardology birth-card calculation works, with a worked birthday example: 52-card structure, suits, ranks, ruling cards, timing, and interpretation limits.",
  alternates: { canonical: "/methodology" },
};

const principles = [
  ["52 cards", "The deck is treated as a calendar-like structure with one card for each week of the year."],
  ["4 suits", "Hearts, Diamonds, Clubs, and Spades describe domains of life: feeling, value, mind, and work."],
  ["13 ranks", "Aces through Kings describe movement inside a suit, from initiation through mastery."],
  ["Fixed birthday map", "A birth card is calculated from the birthday. It is not chosen by a quiz or random draw."],
];

export default function MethodologyPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: "Card Blueprints Methodology",
    description: metadata.description,
    url: `${SITE_URL}/methodology`,
    dateModified: "2026-08-07",
    author: { "@type": "Person", name: "Cassidy Rice" },
    publisher: { "@id": `${SITE_URL}/#organization` },
    mainEntityOfPage: `${SITE_URL}/methodology`,
  };

  return (
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "Methodology", href: "/methodology" }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="max-w-3xl pb-8">
        <p className="oracle-eyebrow mb-4">Calculation and interpretation</p>
        <h1 className="display text-5xl leading-none text-[#14110d] sm:text-6xl">
          How a birthday becomes a card, and how the card becomes a reading.
        </h1>
        <p className="mt-3 text-sm text-[#5b5148]">
          By Cassidy Rice · Updated August 7, 2026 ·{" "}
          <Link href="/editorial-policy" className="underline">
            Editorial policy
          </Link>
        </p>
        <div className="mt-6 border border-[#14110d]/15 bg-[#eadfcd]/70 p-5">
          <p className="oracle-eyebrow mb-2">Quick answer</p>
          <p className="text-base leading-relaxed text-[#3d352d]">
            The birthday gives the card. The suit gives the life domain. The rank gives
            the movement. The ruling card, timing card, and relationship context show
            how the pattern expresses in a real person. Same birthday always produces
            the same birth card.
          </p>
        </div>
      </header>

      <section>
        <h2 className="oracle-eyebrow mb-4">Core structure</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {principles.map(([label, detail]) => (
            <div key={label} className="border border-[#14110d]/15 bg-[#f4f0e7]/78 p-5">
              <p className="font-serif text-2xl text-[#14110d]">{label}</p>
              <p className="mt-2 text-sm leading-relaxed text-[#5b5148]">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 max-w-3xl">
        <h2 className="font-serif text-3xl text-[#14110d]">Worked example</h2>
        <p className="mt-4 font-serif text-lg leading-relaxed text-[#3d352d]">
          Take a public calendar date: <strong>January 15</strong>. In this system the
          date resolves to the <strong>Queen of Diamonds</strong> as birth card — the
          same result every time the math is run. The year is not required for the birth
          card itself; year feeds timing layers when you ask about a specific chapter.
        </p>
        <ol className="mt-5 list-decimal space-y-3 pl-5 font-serif text-lg leading-relaxed text-[#3d352d]">
          <li>
            <strong>Input.</strong> Month and day only for the birth card; optional year
            for ruling-card context and periods.
          </li>
          <li>
            <strong>Map.</strong> The date lands on one of 52 fixed deck positions (Joker
            for December 31; February 29 outside the cycle).
          </li>
          <li>
            <strong>Read structure.</strong> Suit = diamonds (values &amp; resources).
            Rank = Queen (stewardship, refinement, influence inside that suit).
          </li>
          <li>
            <strong>Add ruling card.</strong> Zodiac-linked planetary rulership colors
            how the Queen of Diamonds tends to express for that birth chart layer.
          </li>
          <li>
            <strong>Test in life.</strong> Compare the language to real behavior. Keep
            what matches; drop what does not. The card is a hypothesis generator, not a
            verdict.
          </li>
        </ol>
        <p className="mt-5 font-serif text-lg leading-relaxed text-[#3d352d]">
          You can open the live page for that date at{" "}
          <a href="/born-on/january-15" className="underline">
            /born-on/january-15
          </a>{" "}
          or re-run any birthday in the{" "}
          <Link href="/birth-card-calculator" className="underline">
            birth card calculator
          </Link>
          . If two tools disagree on the same system rules, trust the one you can audit —
          and tell us on the contact page.
        </p>
      </section>

      <section className="mt-10 space-y-5 font-serif text-lg leading-relaxed text-[#3d352d]">
        <h2 className="font-serif text-3xl text-[#14110d]">Interpretation order</h2>
        <p>
          Start with what is fixed: the birthday, the card, the suit, and the rank.
          Then read the range: balanced expression, under-expression, over-expression,
          gift, shadow, timing, and the person or relationship involved.
        </p>
        <p>
          The ruling card colors how the birth card comes through. A period card names
          the chapter. Compatibility adds another person&rsquo;s pattern, which is where
          attraction, friction, support, and repetition become easier to see.
        </p>
        <p>
          A strong reading moves in that order: calculate the card, read the structure,
          compare it with the person, then test whether it explains the behavior or
          dynamic in front of you.
        </p>
      </section>

      <section className="mt-10 max-w-3xl space-y-4 font-serif text-lg leading-relaxed text-[#3d352d]">
        <h2 className="font-serif text-3xl text-[#14110d]">What we do not claim</h2>
        <p>
          Cardology on Card Blueprints is a pattern-recognition system for self-awareness
          and entertainment. It describes tendencies, not fate. It is not medical,
          psychological diagnosis, legal, or financial advice. Paid reports use the same
          deterministic engine as the free tools; interpretation prose is labeled as
          interpretation.
        </p>
      </section>

      <section className="mt-12 border border-[#14110d]/15 bg-[#eadfcd]/55 p-5">
        <h2 className="font-serif text-3xl text-[#14110d]">Use the method</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/birth-card-calculator" className="rounded-full border border-[#14110d]/18 px-4 py-2 text-xs font-bold uppercase text-[#8e321f]">
            Birth Card Calculator
          </Link>
          <Link href="/cardology-for-beginners" className="rounded-full border border-[#14110d]/18 px-4 py-2 text-xs font-bold uppercase text-[#8e321f]">
            Beginners path
          </Link>
          <Link href="/birth-card" className="rounded-full border border-[#14110d]/18 px-4 py-2 text-xs font-bold uppercase text-[#8e321f]">
            All 52 Birth Cards
          </Link>
          <Link href="/52-card-astrology-explained" className="rounded-full border border-[#14110d]/18 px-4 py-2 text-xs font-bold uppercase text-[#8e321f]">
            52-Card Astrology Explained
          </Link>
          <Link href="/about" className="rounded-full border border-[#14110d]/18 px-4 py-2 text-xs font-bold uppercase text-[#8e321f]">
            About
          </Link>
        </div>
      </section>
    </SeoShell>
  );
}
