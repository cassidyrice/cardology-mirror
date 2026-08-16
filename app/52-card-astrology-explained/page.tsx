import type { Metadata } from "next";
import Link from "next/link";
import { SeoShell } from "@/components/seo/SeoShell";
import { ReadingBridge } from "@/components/seo/ReadingBridge";
import { FreeCourseCta } from "@/components/free-course/FreeCourseCta";
import { PlayingCardsBirthdayChart } from "@/components/seo/PlayingCardsBirthdayChart";
import { BIRTHDAY_DIRECTORY_PATH, SITE_NAME, SITE_URL } from "@/lib/site";
import { serializeJsonLdForHtml } from "@/lib/structured-data";

const TITLE = "Playing Cards Birthday Chart & 52-Card Astrology";
const DESCRIPTION =
  "Playing cards birthday chart explained: how the 52-card deck maps to the calendar, what each suit and rank means, and free links to every birthday’s Cardology birth card.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/52-card-astrology-explained" },
  openGraph: {
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    url: "/52-card-astrology-explained",
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Card Blueprints" }],
  },
};

export default function CardAstrology() {
  const faqs = [
    {
      q: "What is a playing cards birthday chart?",
      a: "It is a calendar map that assigns each birthday a card from a standard 52-card deck (Cardology / 52-card astrology). Same birthday always resolves to the same birth card.",
    },
    {
      q: "Why 52 cards?",
      a: "A standard deck has 52 cards, matching the 52 weeks in a year. 52-card astrology links the deck to the calendar so each birthday corresponds to one card.",
    },
    {
      q: "What do the suits mean?",
      a: "Hearts cover relationships and emotion, Diamonds cover values and resources, Clubs cover mind and communication, and Spades cover work, will, and transformation.",
    },
    {
      q: "Is this the same as Cafe Astrology’s playing cards birthday chart?",
      a: "Same family of idea — birthday → playing card — but Card Blueprints uses its own deterministic engine, full date pages, ruling-card layer, and compatibility matrix. Always verify a date in our calculator if tools disagree.",
    },
    {
      q: "How do I find my card fast?",
      a: "Use the free birth card calculator, or open your date in the birthday directory linked from the chart below.",
    },
    {
      q: "What is the Cardology calendar?",
      a: "The Cardology calendar is the deck-to-year mapping at the core of the system: 52 cards for 52 weeks, 4 suits for 4 seasons, 13 ranks for the 13 weeks of a season, and 12 court cards echoing the 12 months. Add every card's value (ace as 1 through king as 13) and the deck sums to 364; the Joker completes the 365-day year.",
    },
    {
      q: "What are birthday playing cards?",
      a: "Birthday playing cards are the same idea by another name: each birthday is assigned one card from a standard 52-card deck. Your birthday's playing card is your birth card — use the calculator or the chart above to see yours.",
    },
    {
      q: "What is playing card astrology?",
      a: "Playing card astrology is the informal name for reading a standard deck as a calendar-and-pattern system — the same family as Cardology and 52-card astrology. It is not horoscope astrology: no planets are charted, and the birthday-to-card math is fixed.",
    },
    {
      q: "What are 52 destiny cards?",
      a: "52 destiny cards is another name for the same deck-to-calendar map: one playing card for each week of the year, used as a birth card chart. Cardology, Cards of Destiny, and 52-card astrology are the same family. Use the birth card chart on this page or the free calculator to see your card.",
    },
  ];

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const pageUrl = `${SITE_URL}/52-card-astrology-explained`;
  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: TITLE,
    description: DESCRIPTION,
    url: pageUrl,
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
    datePublished: "2026-06-05",
    dateModified: "2026-08-16",
    author: {
      "@type": "Person",
      name: "Cassidy Rice",
      url: `${SITE_URL}/about`,
    },
    publisher: { "@id": `${SITE_URL}/#organization` },
  };

  return (
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "52-Card Astrology", href: "/52-card-astrology-explained" }]}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLdForHtml([article, faq]),
        }}
      />

      <h1 className="display mb-3 text-3xl text-bone">Playing Cards Birthday Chart &amp; 52-Card Astrology</h1>
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5" data-ai-summary>
        <p className="eyebrow mb-2 text-gold">Direct answer</p>
        <p className="prose-reading text-mist">
          52-card astrology (Cardology) reads a standard deck as calendar structure:
          each birthday maps to one playing card. Use the chart below or the free
          calculator — same math, checkable results.
        </p>
      </div>
      <p className="mb-4 text-xs text-faint">
        By Cassidy Rice · Updated August 16, 2026 ·{" "}
        <Link href="/methodology" className="text-gold underline underline-offset-4">
          Methodology
        </Link>
      </p>
      <p className="prose-reading mb-6 text-mist">
        People search <strong>playing cards birthday chart</strong>,{" "}
        <strong>playing card astrology</strong>, <strong>birthday playing cards</strong>,{" "}
        <strong>52 destiny cards</strong>, and <strong>birth card chart</strong>{" "}
        for the same underlying map. This page explains the structure, then links every
        date into the full birthday directory.
      </p>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">The deck and the calendar</h2>
        <div className="mb-4 grid gap-3 text-sm sm:grid-cols-3">
          {[
            ["52 cards", "52 weeks in a year"],
            ["4 suits", "4 seasonal domains"],
            ["13 ranks", "13 weeks in a season"],
          ].map(([left, right]) => (
            <div key={left} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="eyebrow mb-1 text-gold">{left}</p>
              <p className="text-mist">{right}</p>
            </div>
          ))}
        </div>
        <p className="prose-reading text-mist">
          There are 52 cards in a deck and 52 weeks in a year. There are 13 ranks per
          suit and roughly 13 weeks per season. These alignments are the backbone: the
          deck is treated as a calendar in disguise. December 31 maps to the Joker;
          the leap day, February 29, maps normally to the 9 of Clubs.
        </p>
      </section>

      <section className="mt-8" id="calendar">
        <h2 className="eyebrow mb-2 text-gold">The Cardology calendar</h2>
        <p className="prose-reading text-mist">
          The Cardology calendar is the deck-to-year mapping at the core of the system:
          52 cards for 52 weeks, four suits for four seasons, 13 ranks for the 13 weeks
          of a season, and 12 court cards echoing the 12 months. Add the value of every
          card — ace as 1 through king as 13 — and the whole deck sums to 364; the Joker
          completes the 365-day year. That arithmetic is why readers treat a deck of
          playing cards as a calendar you can hold in one hand.
        </p>
        <p className="prose-reading mt-3 text-mist">
          To see where your own birthday sits on the Cardology calendar, use the{" "}
          <Link href="/birth-card-calculator" className="text-gold underline underline-offset-4">
            free birth card calculator
          </Link>{" "}
          or open your date directly in the birthday chart above.
        </p>
      </section>

      <section className="mt-10" id="birthday-chart">
        <h2 className="eyebrow mb-2 text-gold">Playing cards birthday chart</h2>
        <p className="prose-reading mb-4 text-mist">
          Each cell is a birthday. Open it for the full Cardology page (birth card,
          ruling card, karma links). Prefer typing a date? Use the{" "}
          <Link href="/birth-card-calculator" className="text-gold underline underline-offset-4">
            birth card calculator
          </Link>
          {" "}or the{" "}
          <a href={BIRTHDAY_DIRECTORY_PATH} className="text-gold underline underline-offset-4">
            birthday index
          </a>
          .
        </p>
        <PlayingCardsBirthdayChart />
      </section>

      <section className="mt-10">
        <h2 className="eyebrow mb-2 text-gold">Suits: four domains of life</h2>
        <ul className="prose-reading space-y-1.5 text-mist">
          <li><span className="text-[#8e321f]">♥ Hearts</span> — relationships &amp; emotion</li>
          <li><span className="text-[#8e321f]">♦ Diamonds</span> — values &amp; resources</li>
          <li><span className="text-[#14110d]">♣ Clubs</span> — mind &amp; communication</li>
          <li><span className="text-[#14110d]">♠ Spades</span> — work, will &amp; transformation</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">Ranks: a developmental arc</h2>
        <p className="prose-reading text-mist">
          Ranks read loosely as a progression — Aces begin, number cards develop the
          theme, and court cards mature it. Rank is the stage; suit is the arena.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">Timing: the cards move</h2>
        <p className="prose-reading text-mist">
          Beyond the fixed birth card, yearly spreads rotate themes as you age. Birth
          card stays; surrounding cards shift. That is timing as chapter language, not
          event prophecy. See also the{" "}
          <Link href="/52-day-period-meaning-tool" className="text-gold underline underline-offset-4">
            52-day period tool
          </Link>
          .
        </p>
      </section>

      <section className="mt-10">
        <h2 className="eyebrow mb-4 text-gold">FAQ</h2>
        <div className="space-y-4">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h3 className="font-serif text-lg text-bone">{f.q}</h3>
              <p className="prose-reading mt-2 text-sm text-mist">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <FreeCourseCta source="52-card-astrology" className="mt-10" />
      <ReadingBridge variant="general" className="mt-10" />

      <div className="card-surface mt-6 rounded-2xl border border-gold/25 p-5">
        <p className="font-serif text-base text-bone">See your card in the system</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/birth-card-calculator" className="inline-block rounded-full bg-foil px-5 py-2 font-serif text-sm text-ink">
            Calculate your birth card →
          </Link>
          <Link href="/products/personal-card-blueprint" className="inline-block rounded-full border border-gold/30 px-5 py-2 font-serif text-sm text-gold">
            Personal Blueprint — $13 →
          </Link>
        </div>
      </div>

      <p className="mt-6 text-sm">
        <Link href="/what-is-cardology" className="text-gold underline underline-offset-4">What is Cardology? →</Link>
        {"  ·  "}
        <Link href="/cardology-for-beginners" className="text-gold underline underline-offset-4">Beginners →</Link>
        {"  ·  "}
        <Link href="/birth-card" className="text-gold underline underline-offset-4">Browse all 52 cards →</Link>
      </p>
    </SeoShell>
  );
}
