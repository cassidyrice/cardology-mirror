import type { Metadata } from "next";
import Link from "next/link";

import { FreeCourseCta } from "@/components/free-course/FreeCourseCta";
import { SeoShell } from "@/components/seo/SeoShell";
import { BirthCardCalculator } from "@/components/seo/BirthCardCalculator";
import {
  DEEP_DIVE_PRICE_LABEL,
  DEEP_DIVE_PRODUCT_NAME,
  DEEP_DIVE_PRODUCT_PATH,
  ONE_QUESTION_TURNAROUND,
} from "@/lib/deep-dive";
import { PAGE_UPDATED_DATES } from "@/lib/page-dates";
import { updatedLabel } from "@/lib/page-updated";
import {
  BIRTHDAY_DIRECTORY_PATH,
  COMPATIBILITY_DIRECTORY_PATH,
  SITE_NAME,
} from "@/lib/site";

const UPDATED = PAGE_UPDATED_DATES["/cardology-for-beginners"];
const TITLE = "Cardology for Beginners: Find Your Birth Card in 10 Minutes";
const DESCRIPTION = `Cardology for beginners: what the 52-card system is, how to find your birth card with playing cards, birth vs ruling card, compatibility, and the ${DEEP_DIVE_PRICE_LABEL} ${DEEP_DIVE_PRODUCT_NAME}.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/cardology-for-beginners" },
  openGraph: {
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    url: "/cardology-for-beginners",
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Card Blueprints" }],
  },
};

const steps = [
  {
    n: "1",
    title: "Learn what Cardology is",
    body: "It is a fixed map from birthday to one playing card — not a shuffled tarot draw and not astrology planets. Same birthday always returns the same card.",
    href: "/what-is-cardology",
    label: "What is Cardology?",
  },
  {
    n: "2",
    title: "Find your birth card",
    body: "Use the free calculator with month, day, and year. You get the lifelong birth card plus the planetary ruling card layer.",
    href: "/birth-card-calculator",
    label: "Birth card calculator",
  },
  {
    n: "3",
    title: "Separate birth card from ruling card",
    body: "Birth card is the engine. Ruling card is the steering. If one description fits and the other explains the tone, you are reading it correctly.",
    href: "/birth-card-vs-ruling-card",
    label: "Birth vs ruling",
  },
  {
    n: "4",
    title: "Read one real day",
    body: "Pull today’s card of the day or notice which suit domain is loud in your week — hearts, clubs, diamonds, or spades.",
    href: "/card-of-the-day",
    label: "Card of the day",
  },
  {
    n: "5",
    title: "Compare two people",
    body: "Run two birthdays through the compatibility calculator, then open the pair page for the deeper dynamic.",
    href: "/birth-card-compatibility-calculator",
    label: "Compatibility calculator",
  },
  {
    n: "6",
    title: "Ask one question only if it earns it",
    body: `If the free tools keep matching real life, the ${DEEP_DIVE_PRODUCT_NAME} (${DEEP_DIVE_PRICE_LABEL}) takes one decision you are circling and reads it from your card, this year's cards, and the card you owe. A mirror, not a forecast. Written for you within ${ONE_QUESTION_TURNAROUND}.`,
    href: DEEP_DIVE_PRODUCT_PATH,
    label: `${DEEP_DIVE_PRODUCT_NAME} · ${DEEP_DIVE_PRICE_LABEL}`,
  },
];

const faqs = [
  {
    q: "What do I need to start Cardology as a beginner?",
    a: "A birthday. You do not need a special deck to calculate a birth card; the free calculator does the math. After that, read the card meaning, then the ruling card, and test the language against a real week.",
  },
  {
    q: "Is Cardology hard to learn?",
    a: "The entry point is simple: one birthday, one card. The cards are coordinates, pattern language, not fortune-telling. Depth comes from suits, ranks, ruling cards, timing, and relationships. Start with your card, then add one layer at a time.",
  },
  {
    q: "Should beginners start with tarot or Cardology?",
    a: "Cardology uses a 52-card playing deck and locks your birth card to your birthday with fixed math. Tarot uses a 78-card deck and usually starts with a shuffle. If you want the fixed birthday card, start here. They are different tools.",
  },
  {
    q: "What should I do after I know my birth card?",
    a: `Read the full card meaning, check your ruling card, look up one important person in your life, and test the language against a real week. If one decision is still circling, the ${DEEP_DIVE_PRODUCT_NAME} (${DEEP_DIVE_PRICE_LABEL}) reads it from your birth card, this year's Long Range and Pluto cards, and the card you owe. It is a mirror, not a forecast, written within ${ONE_QUESTION_TURNAROUND}.`,
  },
];

export default function CardologyForBeginnersPage() {
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const howTo = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to start Cardology as a beginner",
    description: DESCRIPTION,
    step: steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.title,
      text: s.body,
      url: `https://cardblueprints.com${s.href}`,
    })),
  };

  return (
    <SeoShell
      crumb={[
        { label: "Home", href: "/" },
        { label: "What is Cardology?", href: "/what-is-cardology" },
        { label: "For Beginners", href: "/cardology-for-beginners" },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howTo) }} />

      <h1 className="display mb-3 text-3xl text-brand-ink">Cardology for Beginners</h1>
      <div className="mb-4 rounded-2xl border border-brand-line bg-brand-ivory/70 p-5" data-ai-summary>
        <p className="type-eyebrow mb-2 !text-brand-bronze">Direct answer</p>
        <p className="prose-reading text-brand-ink-soft">
          Start Cardology by finding the playing card locked to your birthday, reading
          suit and rank in plain language, then testing the pattern against real life.
          The cards are coordinates: pattern language, not fortune-telling. Find your
          card free before anything paid.
        </p>
      </div>
      <p className="mb-3">
        <Link href="/birth-card-calculator" className="accent-button inline-block">
          Find your birth card free →
        </Link>
      </p>
      <p className="prose-reading mb-6 text-sm text-brand-ink-soft">
        If that card keeps matching real life, the{" "}
        <Link href={DEEP_DIVE_PRODUCT_PATH} className="text-brand-oxblood underline underline-offset-4">
          {DEEP_DIVE_PRODUCT_NAME} · {DEEP_DIVE_PRICE_LABEL}
        </Link>{" "}
        reads one decision from your birth card, this year&apos;s Long Range and Pluto
        cards, and the card you owe. A mirror, not a forecast. Written within {ONE_QUESTION_TURNAROUND}.
      </p>
      <p className="mb-6 text-xs text-brand-ink-soft">
        By Cassidy Rice · Updated {updatedLabel(UPDATED)} ·{" "}
        <Link href="/editorial-policy" className="text-brand-oxblood underline underline-offset-4">
          Editorial policy
        </Link>
      </p>
      <p className="prose-reading mb-8 text-brand-ink-soft">
        This path is for people who searched <strong>cardology for beginners</strong>,{" "}
        <strong>how to find my birth card</strong>, or{" "}
        <strong>what card am I based on my birthday</strong> and want the playing-card
        system — not tarot Major Arcana math and not baby-announcement “birth cards.”
        Arrived via Destiny Cards or Love Cards? Same family:{" "}
        <Link href="/destiny-cards" className="text-brand-oxblood underline underline-offset-4">
          Destiny Cards &amp; Love Cards explained
        </Link>
        . For the long definition, see{" "}
        <Link href="/what-is-cardology" className="text-brand-oxblood underline underline-offset-4">
          what Cardology is
        </Link>
        .
      </p>

      <section className="mt-4">
        <h2 className="type-eyebrow mb-4 !text-brand-bronze">The 10-minute path</h2>
        <ol className="space-y-4">
          {steps.map((s) => (
            <li key={s.n} className="rounded-2xl border border-brand-line bg-brand-ivory/70 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] !text-brand-bronze">
                Step {s.n}
              </p>
              <h3 className="mt-1 font-serif text-xl text-brand-ink">{s.title}</h3>
              <p className="prose-reading mt-2 text-sm text-brand-ink-soft">{s.body}</p>
              <Link href={s.href} className="mt-3 inline-block text-sm text-brand-oxblood underline underline-offset-4">
                {s.label} →
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">Step 2 live: find your birth card</h2>
        <p className="prose-reading mb-4 text-brand-ink-soft">
          Enter any birthday. The result is deterministic — refresh will not change it.
        </p>
        <BirthCardCalculator />
      </section>

      <section className="mt-10">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">The only vocabulary you need on day one</h2>
        <ul className="prose-reading space-y-2 text-brand-ink-soft">
          <li>
            <strong>Birth card</strong> — the lifelong playing card for your birthday.
          </li>
          <li>
            <strong>Suit</strong> — hearts (feeling), clubs (mind), diamonds (value),
            spades (work/will).
          </li>
          <li>
            <strong>Rank</strong> — Ace through King as movement inside that suit.
          </li>
          <li>
            <strong>Ruling card</strong> — expression style layered on the birth card.
          </li>
        </ul>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          When you want spreads instead of birthday math, switch to{" "}
          <Link href="/how-to-read-playing-cards" className="text-brand-oxblood underline underline-offset-4">
            how to read playing cards
          </Link>
          .
        </p>
      </section>

      <section className="mt-8">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">How to know it is working</h2>
        <p className="prose-reading text-brand-ink-soft">
          A useful card description names a specific behavior you can point to in the
          last month — not vague flattery. If nothing matches after an honest week,
          set it down. Cardology is a lens for self-awareness and entertainment;
          tendencies, not fate. Method transparency lives on{" "}
          <Link href="/methodology" className="text-brand-oxblood underline underline-offset-4">
            methodology
          </Link>
          .
        </p>
      </section>

      <div className="card-surface mt-8 rounded-2xl border !border-brand-line p-5">
        <p className="font-serif text-base text-brand-ink">When free tools are not enough</p>
        <p className="mt-2 text-sm leading-relaxed text-brand-ink-soft">
          The {DEEP_DIVE_PRODUCT_NAME} is a one-time {DEEP_DIVE_PRICE_LABEL} purchase: one
          question, read from your birth card, this year&apos;s Long Range and Pluto cards,
          and the card you owe. About 600 words, emailed within {ONE_QUESTION_TURNAROUND}.
          A mirror, not a forecast. No subscription.
        </p>
        <Link
          href={DEEP_DIVE_PRODUCT_PATH}
          className="accent-button mt-4"
        >
          {DEEP_DIVE_PRODUCT_NAME} · {DEEP_DIVE_PRICE_LABEL}
        </Link>
      </div>

      <section className="mt-10">
        <h2 className="type-eyebrow mb-4 !text-brand-bronze">Beginner FAQ</h2>
        <div className="space-y-4">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-2xl border border-brand-line bg-brand-ivory/70 p-4">
              <h3 className="font-serif text-lg text-brand-ink">{f.q}</h3>
              <p className="prose-reading mt-2 text-sm text-brand-ink-soft">{f.a}</p>
            </div>
          ))}
        </div>
        <p className="prose-reading mt-4 text-sm text-brand-ink-soft">
          Price, turnaround, and what the reading will not do are also on the{" "}
          <Link href="/faq" className="text-brand-oxblood underline underline-offset-4">
            FAQ
          </Link>
          .
        </p>
      </section>

      <FreeCourseCta source="beginners" className="mt-10" />

      <div className="card-surface mt-6 rounded-2xl p-5">
        <p className="font-serif text-base text-brand-ink">Browse the library</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href={BIRTHDAY_DIRECTORY_PATH} className="rounded-full border border-brand-line px-4 py-2 text-sm text-brand-ink-soft hover:text-brand-ink">
            Every birthday
          </a>
          <a href={COMPATIBILITY_DIRECTORY_PATH} className="rounded-full border border-brand-line px-4 py-2 text-sm text-brand-ink-soft hover:text-brand-ink">
            Every pairing
          </a>
          <Link href="/birth-card" className="rounded-full border border-brand-line px-4 py-2 text-sm text-brand-ink-soft hover:text-brand-ink">
            All 52 cards
          </Link>
          <Link href="/about" className="rounded-full border border-brand-line px-4 py-2 text-sm text-brand-ink-soft hover:text-brand-ink">
            About Card Blueprints
          </Link>
        </div>
      </div>
    </SeoShell>
  );
}
