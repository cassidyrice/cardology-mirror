import type { Metadata } from "next";
import Link from "next/link";
import { SeoShell } from "@/components/seo/SeoShell";

export const metadata: Metadata = {
  title: "What Is Cardology? The 52-Card System, Explained",
  description:
    "What is Cardology? A plain-English explanation of the deterministic 52-card system that maps your birthday to a single playing card — your birth card.",
  alternates: { canonical: "/what-is-cardology" },
  openGraph: {
    title: "What Is Cardology? The 52-Card System, Explained",
    description: "A plain-English explanation of the deterministic 52-card system behind your birth card.",
    url: "/what-is-cardology",
  },
};

export default function WhatIsCardology() {
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Is Cardology the same as astrology?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "They're related but different. Astrology reads the positions of planets at your birth; Cardology maps your birthday to one of the 52 playing cards through a fixed mathematical system. Cardology is fully deterministic — no chart drawing and nothing random.",
        },
      },
      {
        "@type": "Question",
        name: "Does Cardology predict the future?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Cardology reads timing as pattern language: pressure, opportunity, friction, and focus. The stronger use is recognizing the chapter you are in, not pretending the card can promise a specific event.",
        },
      },
      {
        "@type": "Question",
        name: "How many birth cards are there?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "There are 52 birth cards — one for each card in a standard deck. Every birthday maps to exactly one of them.",
        },
      },
      {
        "@type": "Question",
        name: "How is a birth card calculated?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "By formula. Each card carries a fixed numeric value based on its position in the deck, and a simple equation on your birth month and day resolves to exactly one of those values. No chart, no interpretation step, no randomness. Two people running the math on the same birthday will always get the same card.",
        },
      },
      {
        "@type": "Question",
        name: "Where does Cardology come from?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The system descends from a 19th-century work called The Mystic Test Book by Olney Richmond, later developed by authors including Florence Campbell, Edith Randall, and Robert Lee Camp. The structure itself is older than any of those books: the deck-to-calendar correspondences (52 cards, 52 weeks, 4 suits, 13 ranks) are built into the deck.",
        },
      },
      {
        "@type": "Question",
        name: "Do I need to believe in Cardology for it to be useful?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Treat the card as a structured pattern map. The descriptions name specific behavior and dynamics you can test against yourself, public figures, and people close to you. If it doesn't clarify anything real, discard it.",
        },
      },
    ],
  };

  return (
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "What is Cardology?", href: "/what-is-cardology" }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />

      <h1 className="display mb-3 text-3xl text-bone">What Is Cardology?</h1>
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5" data-ai-summary>
        <p className="eyebrow mb-2 text-gold">Direct answer</p>
        <p className="prose-reading text-mist">
          Cardology is a deterministic 52-card system that maps a birthday to a
          playing card and uses that card as pattern language for people,
          compatibility, timing, and recurring dynamics.
        </p>
      </div>
      <p className="prose-reading mb-6 text-mist">
        Cardology maps your birthday to a single playing card — your{" "}
        <strong>birth card</strong> — and uses the 52-card deck as a language for
        personality, timing, and relationships. Here&rsquo;s the part that separates it
        from your horoscope: it&rsquo;s <strong>deterministic</strong>. Same birthday,
        same card, every time — a fixed formula, not a mood ring or someone&rsquo;s
        interpretation of the stars.
      </p>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">The core idea</h2>
        <p className="prose-reading text-mist">
          A standard deck has 52 cards, and the calendar has 52 weeks. Cardology
          links the two: every one of the 365 dates is assigned to a card by a
          set rule. Your birth card is your lifelong significator — the clearest
          single description of how you tend to operate.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">Why it works best on real people</h2>
        <p className="prose-reading text-mist">
          The cards become useful when you apply them to actual lives: your own
          patterns, the people closest to you, public figures, family roles,
          attraction, friction, work chemistry, and the places a strength tips
          into excess. Nothing here is fixed fate; it is a vocabulary for seeing
          behavior and relationship dynamics with more precision.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">The four suits</h2>
        <p className="prose-reading mb-2 text-mist">Each suit points at a different domain of life:</p>
        <ul className="prose-reading space-y-1.5 text-mist">
          <li><span className="text-[#e0654a]">♥ Hearts</span> — relationships &amp; emotion</li>
          <li><span className="text-[#d9b26a]">♦ Diamonds</span> — values &amp; resources</li>
          <li><span className="text-[#7fae8f]">♣ Clubs</span> — mind &amp; communication</li>
          <li><span className="text-[#7b6cf0]">♠ Spades</span> — work, will &amp; transformation</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">Two layers: birth card and ruling card</h2>
        <p className="prose-reading text-mist">
          Most people have two key cards — the birth card and a planetary ruling
          card that colors how it expresses. We break down the difference in{" "}
          <Link href="/birth-card-vs-ruling-card" className="text-gold underline underline-offset-4">
            birth card vs ruling card
          </Link>
          .
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">How the calculation actually works</h2>
        <p className="prose-reading text-mist">
          There is no chart to draw and no judgment call to make. Every card in
          the deck carries a fixed numeric value based on its position, from the
          Ace of Hearts through the King of Spades. A short equation on your
          birth month and day resolves to exactly one of those values, and that
          value is your card. Run it a thousand times and you get the same
          answer a thousand times. That is the whole appeal: the input is your
          birthday, the output is a card, and everything in between is
          arithmetic.
        </p>
        <p className="prose-reading mt-3 text-mist">
          The same property makes the system easy to check. If a Cardology page
          tells you March 15 is the 8 of Diamonds, you can verify it. Either
          the math holds or it does not. Most personality systems cannot make
          that offer.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">The structure behind it</h2>
        <p className="prose-reading text-mist">
          The deck and the calendar share an architecture, and Cardology takes
          that correspondence seriously. 52 cards, 52 weeks. 4 suits, 4
          seasons. 13 ranks, 13 weeks in a season. Add up the face values of
          every card in the deck, counting Jack as 11, Queen as 12, and King as
          13, and you get 364; with the Joker the deck rounds out a solar year.
          You do not have to assign meaning to any of that to notice it is not
          an accident of design. The deck was built as a calendar, and
          Cardology is the practice of reading it as one.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">Where it comes from</h2>
        <p className="prose-reading text-mist">
          The modern system descends from <em>The Mystic Test Book</em>,
          published by Olney Richmond in 1893, and was developed through the
          20th century by Florence Campbell and Edith Randall
          (<em>Sacred Symbols of the Ancients</em>) and more recently by Robert
          Lee Camp. The lineage matters less than the structure: the
          deck-to-calendar correspondences existed before any of those books
          and will outlast all of them. The books are documentation. The deck
          is the system.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">What Cardology is not</h2>
        <p className="prose-reading text-mist">
          It is not a random draw, and it is not a personality costume. A card cannot
          tell you what will happen on Tuesday. What it can do is name a recurring
          pattern with enough precision that you start seeing it in behavior: the
          specific way someone avoids, overreaches, spends, withdraws, performs,
          bonds, or takes charge. The value is in the comparison between the card
          and the person in front of you.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">How people actually use it</h2>
        <p className="prose-reading text-mist">
          Three ways, mostly. First, the birth card as a baseline: a standing
          description of your default pattern, useful the way a personality
          framework is useful, as a vocabulary for things you half-knew about
          yourself. Second, other people: finding the cards of partners, parents,
          friends, coworkers, artists, leaders, and public figures so the card
          language becomes visible in real life. Third, compatibility: comparing
          two people&rsquo;s cards to name where the friction and the attraction live,
          in language neither person has to take personally. Fourth, timing: the
          same deck mathematics produce daily and yearly cards, which show the
          pressure and focus of a chapter.
        </p>
      </section>

      <div className="card-surface mt-10 rounded-2xl p-5">
        <p className="font-serif text-base text-bone">Find your birth card</p>
        <p className="mt-1 text-sm text-faint">It takes one tap and your birthday.</p>
        <Link href="/birth-card-calculator" className="mt-3 inline-block rounded-full bg-foil px-5 py-2 font-serif text-sm text-ink">
          Birth Card Calculator →
        </Link>
      </div>

      <p className="mt-6 text-sm">
        <Link href="/52-card-astrology-explained" className="text-gold underline underline-offset-4">
          Next: 52-card astrology explained →
        </Link>
      </p>
    </SeoShell>
  );
}
