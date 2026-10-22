import type { Metadata } from "next";
import Link from "next/link";
import { SeoShell } from "@/components/seo/SeoShell";
import { PlayingCardsBirthdayChart } from "@/components/seo/PlayingCardsBirthdayChart";
import { BIRTHDAY_DIRECTORY_PATH, SITE_NAME, SITE_URL } from "@/lib/site";
import { serializeJsonLdForHtml } from "@/lib/structured-data";
import { PAGE_UPDATED_DATES } from "@/lib/page-dates";
import { updatedLabel } from "@/lib/page-updated";

const UPDATED = PAGE_UPDATED_DATES["/52-card-astrology-explained"];

const TITLE = "Playing Cards Birthday Chart & 52-Card Astrology";
const DESCRIPTION =
  "Playing cards birthday chart explained. The 52-card deck is a calendar. Each suit and rank means something. Your birthday already has a card.";

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
      a: "A calendar map. It assigns each birthday one card from a standard 52-card deck (Cardology / 52-card astrology). Same birthday, same birth card, every time. You cannot reroll.",
    },
    {
      q: "Why 52 cards?",
      a: "A standard deck has 52 cards. A year has 52 weeks. 52-card astrology links the deck to the calendar, so each birthday corresponds to one card. It was hiding in the junk drawer the whole time.",
    },
    {
      q: "What do the suits mean?",
      a: "Hearts: relationships and emotion. Diamonds: values and resources. Clubs: mind and communication. Spades: work, will, and transformation. You already know which one you are avoiding.",
    },
    {
      q: "Is this the same as Cafe Astrology’s playing cards birthday chart?",
      a: "Same family of idea: birthday → playing card. Card Blueprints runs its own deterministic engine, full date pages, a ruling-card layer, and a compatibility matrix. If tools disagree, check the date in our calculator. Then check the math.",
    },
    {
      q: "How do I find my card fast?",
      a: "Use the free birth card calculator. Or open your date in the birthday directory linked from the chart below. Either way it takes less time than rereading that text.",
    },
    {
      q: "What is the Cardology calendar?",
      a: "The Cardology calendar is the deck-to-year mapping at the core of the system. 52 cards for 52 weeks. 4 suits for 4 seasons. 13 ranks for the 13 weeks of a season. 12 court cards echoing the 12 months. Add every card's value (ace as 1 through king as 13) and the deck sums to 364. The Joker completes the 365-day year.",
    },
    {
      q: "What are birthday playing cards?",
      a: "Birthday playing cards are the same idea with a different name tag. Each birthday is assigned one card from a standard 52-card deck. Your birthday's playing card is your birth card. Use the calculator or the chart above to see yours.",
    },
    {
      q: "What is playing card astrology?",
      a: "Playing card astrology is the informal name for reading a standard deck as a calendar-and-pattern system. Same family as Cardology and 52-card astrology. It is not horoscope astrology. No planets are charted. The birthday-to-card math is fixed, and it does not care about your rising sign.",
    },
    {
      q: "What are 52 destiny cards?",
      a: "It is another name for the same deck-to-calendar map. One playing card for each week of the year, used as a birth card chart. Cardology, the older book names, and 52-card astrology are the same family wearing different jackets. Use the birth card chart on this page or the free calculator to see your card.",
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
    dateModified: UPDATED,
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

      <h1 className="display mb-3 text-3xl text-brand-ink">Playing Cards Birthday Chart &amp; 52-Card Astrology</h1>
      <div className="mb-6 rounded-2xl border border-brand-line bg-brand-ivory/70 p-5" data-ai-summary>
        <p className="type-eyebrow mb-2 !text-brand-bronze">Direct answer</p>
        <p className="prose-reading text-brand-ink-soft">
          52-card astrology (Cardology) reads a standard deck as a calendar.
          Each birthday maps to one playing card. Use the chart below or the free
          calculator. Same math. Checkable results. No vibes required.
        </p>
      </div>
      <p className="mb-4 text-xs text-brand-ink-soft">
        By Cassidy Rice · Updated {updatedLabel(UPDATED)} ·{" "}
        <Link href="/methodology" className="text-brand-oxblood underline underline-offset-4">
          Methodology
        </Link>
      </p>
      <p className="prose-reading mb-6 text-brand-ink-soft">
        People search <strong>playing cards birthday chart</strong>,{" "}
        <strong>playing card astrology</strong>, <strong>birthday playing cards</strong>,{" "}
        and <strong>birth card chart</strong>{" "}
        for the same underlying map. Different words. Same deck. This page explains the
        structure, then links every date into the full birthday directory.
      </p>

      <section className="mt-8">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">The deck and the calendar</h2>
        <div className="mb-4 grid gap-3 text-sm sm:grid-cols-3">
          {[
            ["52 cards", "52 weeks in a year"],
            ["4 suits", "4 seasonal domains"],
            ["13 ranks", "13 weeks in a season"],
          ].map(([left, right]) => (
            <div key={left} className="rounded-2xl border border-brand-line bg-brand-ivory/70 p-4">
              <p className="type-eyebrow mb-1 !text-brand-bronze">{left}</p>
              <p className="text-brand-ink-soft">{right}</p>
            </div>
          ))}
        </div>
        <p className="prose-reading text-brand-ink-soft">
          There are 52 cards in a deck and 52 weeks in a year. There are 13 ranks per
          suit and roughly 13 weeks per season. That is the backbone. The deck is a
          calendar in a cheap disguise. December 31 maps to the Joker. The leap day,
          February 29, maps normally to the 9 of Clubs.
        </p>
      </section>

      <section className="mt-8" id="calendar">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">The Cardology calendar</h2>
        <p className="prose-reading text-brand-ink-soft">
          The Cardology calendar is the deck-to-year mapping at the core of the system.
          52 cards for 52 weeks. Four suits for four seasons. 13 ranks for the 13 weeks
          of a season. 12 court cards echoing the 12 months. Add the value of every
          card, ace as 1 through king as 13, and the whole deck sums to 364. The Joker
          completes the 365-day year. That is why readers call a deck of playing cards
          a calendar you can hold in one hand. You have been shuffling a year.
        </p>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          To see where your own birthday sits on the Cardology calendar, use the{" "}
          <Link href="/birth-card-calculator" className="text-brand-oxblood underline underline-offset-4">
            free birth card calculator
          </Link>{" "}
          or open your date directly in the birthday chart above.
        </p>
      </section>

      <section className="mt-10" id="birthday-chart">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">Playing cards birthday chart</h2>
        <p className="prose-reading mb-4 text-brand-ink-soft">
          Each cell is a birthday. Open it for the full Cardology page (birth card,
          ruling card, karma links). Yes, you can look up your ex. Prefer typing a
          date? Use the{" "}
          <Link href="/birth-card-calculator" className="text-brand-oxblood underline underline-offset-4">
            birth card calculator
          </Link>
          {" "}or the{" "}
          <a href={BIRTHDAY_DIRECTORY_PATH} className="text-brand-oxblood underline underline-offset-4">
            birthday index
          </a>
          .
        </p>
        <PlayingCardsBirthdayChart />
      </section>

      <section className="mt-10">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">Suits: four domains of life</h2>
        <ul className="prose-reading space-y-1.5 text-brand-ink-soft">
          <li><span className="text-[#8e321f]">♥ Hearts</span>: relationships &amp; emotion. The texts you reread.</li>
          <li><span className="text-[#8e321f]">♦ Diamonds</span>: values &amp; resources. What you think you are worth.</li>
          <li><span className="text-[#14110d]">♣ Clubs</span>: mind &amp; communication. The 2am thoughts.</li>
          <li><span className="text-[#14110d]">♠ Spades</span>: work, will &amp; transformation. The part you keep postponing.</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">Ranks: a developmental arc</h2>
        <p className="prose-reading text-brand-ink-soft">
          Ranks read loosely as a progression. Aces begin. Number cards develop the
          theme. Court cards mature it, eventually. Rank is the stage. Suit is the arena.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">Timing: the cards move</h2>
        <p className="prose-reading text-brand-ink-soft">
          Beyond the fixed birth card, yearly spreads rotate themes as you age. The birth
          card stays. The cards around it shift. That is timing as chapter language. It is
          not event prophecy, so stop asking it about Tuesday. See also the{" "}
          <Link href="/52-day-period-meaning-tool" className="text-brand-oxblood underline underline-offset-4">
            52-day period tool
          </Link>
          .
        </p>
      </section>

      <section className="mt-10">
        <h2 className="type-eyebrow mb-4 !text-brand-bronze">FAQ</h2>
        <div className="space-y-4">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-2xl border border-brand-line bg-brand-ivory/70 p-4">
              <h3 className="font-serif text-lg text-brand-ink">{f.q}</h3>
              <p className="prose-reading mt-2 text-sm text-brand-ink-soft">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="card-surface mt-6 rounded-2xl border !border-brand-line p-5">
        <p className="font-serif text-base text-brand-ink">You already have a card. Go look.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/birth-card-calculator" className="ink-button">
            Calculate your birth card →
          </Link>
        </div>
      </div>

      <p className="mt-6 text-sm">
        <Link href="/what-is-cardology" className="text-brand-oxblood underline underline-offset-4">What is Cardology? →</Link>
        {"  ·  "}
        <Link href="/cardology-for-beginners" className="text-brand-oxblood underline underline-offset-4">Beginners →</Link>
        {"  ·  "}
        <Link href="/birth-card" className="text-brand-oxblood underline underline-offset-4">Browse all 52 cards →</Link>
      </p>
    </SeoShell>
  );
}
