import type { Metadata } from "next";
import Link from "next/link";
import { FreeCourseCta } from "@/components/free-course/FreeCourseCta";
import { SeoShell } from "@/components/seo/SeoShell";
import { ReadingBridge } from "@/components/seo/ReadingBridge";
import { DeckMatrix } from "@/components/cards/DeckMatrix";
import { SUIT_COLOR_PAPER } from "@/lib/cards";
import { cardsBySuit } from "@/lib/seo-cards";
import {
  BIRTHDAY_DIRECTORY_PATH,
  COMPATIBILITY_DIRECTORY_PATH,
  SITE_URL,
} from "@/lib/site";

const UPDATED = "2026-08-15";

const faqs = [
  {
    q: "What is a birth card?",
    a: "In Cardology, a birth card is the one playing card your month and day map to in a fixed 52-card calendar system. The same birthday always returns the same card. It is not a greeting card and not a tarot Major Arcana calculation.",
  },
  {
    q: "How do I find my birth card?",
    a: "Use the free birth card calculator, or scan the Cardology chart. Entering your birthday returns the fixed birth card plus its planetary ruling card, with a link to the full meaning.",
  },
  {
    q: "Are Cardology birth cards the same as tarot birth cards?",
    a: "No. Cardology uses a standard 52-card playing deck — Hearts, Clubs, Diamonds, and Spades. Tarot birth-card systems usually calculate Major Arcana cards from a 78-card tarot deck.",
  },
  {
    q: "Does a birth card ever change?",
    a: "No. The birth card is fixed by month and day and stays the same for life. Timing cards and yearly periods can change, but the birth card remains the baseline pattern.",
  },
  {
    q: "What do the 52 birth cards mean?",
    a: "Each meaning combines suit and rank. Hearts emphasize relationships and emotion; Diamonds values and resources; Clubs mind and communication; Spades work, will, and transformation. Rank describes how that life domain moves.",
  },
];

export const metadata: Metadata = {
  title: "All 52 Cardology Birth Cards — Meanings & Personality",
  description:
    "Browse all 52 Cardology birth cards by suit, with meanings, strengths, shadow patterns, and links to the free birth card calculator.",
  alternates: { canonical: "/birth-card" },
};

const SUIT_GLYPHS: Record<string, string> = {
  hearts: "♥", diamonds: "♦", clubs: "♣", spades: "♠",
};

export default function BirthCardIndex() {
  const groups = cardsBySuit();
  const cards = groups.flatMap((group) => group.cards);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "The 52 Birth Cards",
    description: metadata.description,
    url: `${SITE_URL}/birth-card`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: cards.map((card, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: `${card.label} Birth Card Meaning`,
        url: `${SITE_URL}/birth-card/${card.slug}`,
      })),
    },
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "All 52 Cardology Birth Cards",
    description: metadata.description,
    author: { "@type": "Person", name: "Cassidy Rice", url: `${SITE_URL}/about` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    dateModified: UPDATED,
    mainEntityOfPage: `${SITE_URL}/birth-card`,
  };
  return (
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "Birth Cards", href: "/birth-card" }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <h1 className="display mb-3 text-3xl text-bone">The 52 Birth Cards</h1>
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5" data-ai-summary>
        <p className="eyebrow mb-2 text-gold">Direct answer</p>
        <p className="prose-reading text-mist">
          A Cardology birth card is the one playing card your birthday maps to in a
          fixed 52-card system. Same birthday, same card for life. This is a standard
          playing deck — not tarot and not a paper birthday card. Browse all 52 meanings
          below or use the free calculator to find yours.
        </p>
      </div>
      <p className="mb-4 text-xs text-faint">
        By{" "}
        <Link href="/about" className="text-gold underline underline-offset-4">
          Cassidy Rice
        </Link>{" "}
        · Reviewed August 15, 2026 ·{" "}
        <Link href="/editorial-policy" className="text-gold underline underline-offset-4">
          Editorial policy
        </Link>{" "}
        ·{" "}
        <Link href="/methodology" className="text-gold underline underline-offset-4">
          Calculation method
        </Link>
      </p>
      <p className="prose-reading mb-6 text-mist">
        Every birthday maps to exactly one of the 52 playing cards — your{" "}
        <strong>birth card</strong>. No quiz, no choosing: a fixed vocabulary for how you
        operate, whether you&rsquo;ve noticed it or not. Pick a card below, or{" "}
        <Link href="/birth-card-calculator" className="text-gold underline underline-offset-4">
          calculate yours
        </Link>
        {" "}or open the{" "}
        <Link href="/birth-card-calculator#cardology-chart" className="text-gold underline underline-offset-4">
          Cardology chart
        </Link>
        .
      </p>
      <p className="prose-reading mb-6 text-mist">
        Prefer to browse another way? Explore{" "}
        <a href={BIRTHDAY_DIRECTORY_PATH} className="text-gold underline underline-offset-4">
          birthdays by date
        </a>{" "}
        or{" "}
        <a href={COMPATIBILITY_DIRECTORY_PATH} className="text-gold underline underline-offset-4">
          every two-card pairing
        </a>
        .
      </p>

      <nav className="mb-10 flex flex-wrap gap-2 text-[0.65rem] uppercase tracking-wider2">
        {groups.map((g) => (
          <a
            key={g.suit}
            href={`#${g.suit}`}
            className="rounded-full border border-white/10 px-3 py-1 text-faint transition hover:border-gold hover:text-gold"
          >
            {SUIT_GLYPHS[g.suit]} {g.suit}
          </a>
        ))}
      </nav>

      <section className="mb-10 rounded-2xl border border-gold/20 bg-white/[0.04] p-5" aria-labelledby="popular-card-meanings">
        <h2 id="popular-card-meanings" className="eyebrow mb-3 text-gold">Popular card meanings</h2>
        <p className="prose-reading mb-4 text-sm text-mist">
          Start with the cards people are reading most, then browse the full deck below.
        </p>
        <ul className="flex flex-wrap gap-2 text-sm">
          {[
            ["Ace of Hearts meaning", "/birth-card/ace-of-hearts"],
            ["10 of Hearts meaning", "/birth-card/10-of-hearts"],
            ["10 of Diamonds meaning", "/birth-card/10-of-diamonds"],
          ].map(([label, href]) => (
            <li key={href}>
              <Link href={href} className="inline-block rounded-full border border-gold/30 px-4 py-2 text-gold transition hover:border-gold hover:text-bone">
                {label} →
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <DeckMatrix />

      <div className="space-y-12">
        {groups.map((g) => (
          <section key={g.suit} id={g.suit} className="scroll-mt-10">
            <h2 className="eyebrow mb-4 text-gold">
              {SUIT_GLYPHS[g.suit]} {cap(g.suit)} · {g.domain}
            </h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {g.cards.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/birth-card/${c.slug}`}
                    className="card-surface group relative flex aspect-[2.5/3.5] flex-col items-center justify-center overflow-hidden p-4 text-center transition-all hover:border-gold/50 hover:shadow-[0_0_20px_-5px_rgba(217,178,106,0.3)]"
                  >
                    <div
                      className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-10"
                      style={{
                        background: `radial-gradient(circle at 50% 50%, ${c.color}, transparent 70%)`,
                      }}
                    />
                    <span className="font-serif text-4xl leading-none" style={{ color: SUIT_COLOR_PAPER[c.suit] }}>
                      {c.code}
                    </span>
                    <span className="mt-2 block font-serif text-sm text-bone">
                      {c.label}
                    </span>
                    {c.title && (
                      <span className="mt-0.5 block text-[0.6rem] uppercase tracking-wider text-faint">
                        {c.title}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="mt-12" id="faq">
        <h2 className="eyebrow mb-4 text-gold">Birth card FAQ</h2>
        <div className="space-y-4">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h3 className="font-serif text-lg text-bone">{f.q}</h3>
              <p className="prose-reading mt-2 text-sm text-mist">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <FreeCourseCta source="card-meanings" className="mt-12" />
      <ReadingBridge variant="card" className="mt-8" />
    </SeoShell>
  );
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
