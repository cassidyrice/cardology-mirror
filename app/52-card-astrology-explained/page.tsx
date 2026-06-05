import type { Metadata } from "next";
import Link from "next/link";
import { SeoShell } from "@/components/seo/SeoShell";

export const metadata: Metadata = {
  title: "52-Card Astrology Explained: Cards, Suits & Timing",
  description:
    "52-card astrology explained: how a standard deck maps to the calendar, what the suits and ranks mean, and how Cardology uses the cards for personality and timing.",
  alternates: { canonical: "/52-card-astrology-explained" },
  openGraph: {
    title: "52-Card Astrology Explained: Cards, Suits & Timing",
    description: "How a standard deck maps to the calendar — suits, ranks, and timing in Cardology.",
    url: "/52-card-astrology-explained",
  },
};

export default function CardAstrology() {
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Why 52 cards?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "A standard deck has 52 cards, matching the 52 weeks in a year. 52-card astrology links the deck to the calendar so that each birthday corresponds to one card.",
        },
      },
      {
        "@type": "Question",
        name: "What do the suits mean?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Hearts cover relationships and emotion, Diamonds cover values and resources, Clubs cover mind and communication, and Spades cover work, will, and transformation.",
        },
      },
    ],
  };

  return (
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "52-Card Astrology", href: "/52-card-astrology-explained" }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />

      <h1 className="display mb-3 text-3xl text-bone">52-Card Astrology, Explained</h1>
      <p className="prose-reading mb-6 text-mist">
        &ldquo;52-card astrology&rdquo; is another name for Cardology — a system that uses
        an ordinary deck of playing cards as a map of personality and timing. The
        deck&rsquo;s structure mirrors the calendar, which is what makes the link
        between a birthday and a card possible.
      </p>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">The deck and the calendar</h2>
        <p className="prose-reading text-mist">
          There are 52 cards in a deck and 52 weeks in a year. There are 13 ranks
          per suit and roughly 13 weeks per season. Add the values of all the
          cards and you land near the number of days in a year. These alignments
          are the backbone of the system: the deck is treated as a calendar in
          disguise.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">Suits: four domains of life</h2>
        <ul className="prose-reading space-y-1.5 text-mist">
          <li><span className="text-[#e0654a]">♥ Hearts</span> — relationships &amp; emotion</li>
          <li><span className="text-[#d9b26a]">♦ Diamonds</span> — values &amp; resources</li>
          <li><span className="text-[#7fae8f]">♣ Clubs</span> — mind &amp; communication</li>
          <li><span className="text-[#7b6cf0]">♠ Spades</span> — work, will &amp; transformation</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">Ranks: a developmental arc</h2>
        <p className="prose-reading text-mist">
          Ranks read loosely as a progression — Aces begin, number cards develop
          the theme, and the court cards (Jack, Queen, King) mature it into
          mastery. The rank tells you the &ldquo;stage,&rdquo; the suit tells you the
          &ldquo;arena.&rdquo; Together they describe how a person tends to operate.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">Timing: the cards move</h2>
        <p className="prose-reading text-mist">
          Beyond the fixed birth card, the system lays out yearly spreads — cards
          that rotate through planetary periods as you age. That&rsquo;s how Cardology
          handles timing: not as prediction, but as a map of which themes are
          active when. Your birth card stays the same; the surrounding cards
          shift.
        </p>
      </section>

      <div className="card-surface mt-10 rounded-2xl p-5">
        <p className="font-serif text-base text-bone">See your card in the system</p>
        <Link href="/birth-card-calculator" className="mt-3 inline-block rounded-full bg-foil px-5 py-2 font-serif text-sm text-ink">
          Calculate your birth card →
        </Link>
      </div>

      <p className="mt-6 text-sm">
        <Link href="/what-is-cardology" className="text-gold underline underline-offset-4">What is Cardology? →</Link>
        {"  ·  "}
        <Link href="/birth-card" className="text-gold underline underline-offset-4">Browse all 52 cards →</Link>
      </p>
    </SeoShell>
  );
}
