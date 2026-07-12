import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { ReadingBridge } from "@/components/seo/ReadingBridge";
import { READER_PHONE_DISPLAY, READER_PHONE_TEL, TRIAL_NAME, TRIAL_PATH } from "@/lib/offers";
import { SUIT_COLOR, SUIT_DOMAIN, SUIT_GLYPH, type Suit } from "@/lib/cards";
import { rankTheme, suitDomainPlain, SPREADS_HUB_PATH } from "@/lib/spreads";

export const metadata: Metadata = {
  title: "How to Read Playing Cards: Cartomancy for Beginners",
  description:
    "How to read playing cards with a standard 52-card deck: the four suit meanings, the Ace-to-King rank arc, your first reading in five steps, and when to skip the shuffle.",
  alternates: { canonical: "/how-to-read-playing-cards" },
  openGraph: {
    title: "How to Read Playing Cards: Cartomancy for Beginners",
    description:
      "Suit meanings, the Ace-to-King rank arc, and your first reading in five steps — with an ordinary 52-card deck. No tarot deck required.",
    url: "/how-to-read-playing-cards",
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Card Blueprints" }],
  },
};

// Suit order matches the deck's own data layer (lib/seo-cards).
const SUITS: Suit[] = ["hearts", "clubs", "diamonds", "spades"];

// Rank display follows the site's card labels: words for Ace and the courts,
// digits for the number cards.
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;
const RANK_LABEL: Record<string, string> = { A: "Ace", J: "Jack", Q: "Queen", K: "King" };

export default function HowToReadPlayingCards() {
  const faqs = [
    {
      q: "Can you do tarot spreads with playing cards?",
      a: "Yes. Spread positions don't care which deck you deal them from, so any tarot layout works with 52 cards. The suits translate directly — Cups become Hearts, Wands become Clubs, Pentacles become Diamonds, Swords become Spades. You lose the 22 Major Arcana and one court card per suit, and playing-card cartomancy traditions simply work without them.",
    },
    {
      q: "What does each suit mean?",
      a: "Hearts govern relationships and emotion. Clubs govern mind and communication. Diamonds govern values and resources. Spades govern work, will, and transformation. The suit names the arena of life a card is talking about; the rank names the move being made in that arena.",
    },
    {
      q: "Do I need a special deck?",
      a: "No. Any standard 52-card deck works — the meanings live in the deck's structure of suits and ranks, not in the artwork. Set the Jokers aside for spread work; in Cardology the Joker belongs only to people born on December 31.",
    },
    {
      q: "How do you start reading playing cards?",
      a: "Start with one real question and a three-card draw: shuffle, lay three cards left to right as past, present, and future, then read each card as its suit (the arena) plus its rank (the move). Write down the sentence the three cards make and test it against your actual week.",
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

  return (
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "How to Read Playing Cards", href: "/how-to-read-playing-cards" }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />

      <h1 className="display mb-3 text-3xl text-bone">How to Read Playing Cards</h1>
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5" data-ai-summary>
        <p className="eyebrow mb-2 text-gold">Direct answer</p>
        <p className="prose-reading text-mist">
          To read playing cards, take one standard 52-card deck and read each
          card as suit plus rank: the suit is the arena of life, the rank is
          the move being made in it. Then either shuffle and draw a spread, or
          calculate the deterministic birth card from a birthday.
        </p>
      </div>
      <p className="prose-reading mb-6 text-mist">
        Cartomancy with playing cards is older than tarot&rsquo;s fame and
        needs none of its equipment. The deck in your junk drawer already
        carries the whole system: four suits for the four arenas of a life,
        thirteen ranks for the moves made inside them. This page teaches the
        vocabulary and walks you through a first reading — then shows you the
        shortcut this site is built on, where no shuffle is needed at all.
      </p>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">What do you need to start?</h2>
        <p className="prose-reading text-mist">
          A standard 52-card deck and something to write with. That is the
          entire kit. The meanings live in the deck&rsquo;s structure — which
          suit, which rank — not in special artwork, so a casino deck reads as
          well as an heirloom. Set the Jokers aside for spread work (in
          Cardology the Joker belongs only to people born on December 31). If
          you are wondering how this relates to tarot, the suits map one to
          one; the full comparison lives at{" "}
          <Link href="/cartomancy-vs-tarot" className="text-gold underline underline-offset-4">
            cartomancy vs tarot
          </Link>
          .
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">What does each suit mean?</h2>
        <p className="prose-reading mb-2 text-mist">
          The suit is the arena — the part of life a card is talking about.
          These four domains are the same ones every card page on this site is
          built from:
        </p>
        <ul className="prose-reading space-y-2 text-mist">
          {SUITS.map((suit) => (
            <li key={suit}>
              <span style={{ color: SUIT_COLOR[suit] }}>
                {SUIT_GLYPH[suit]} {suit.charAt(0).toUpperCase() + suit.slice(1)}
              </span>{" "}
              — {SUIT_DOMAIN[suit].toLowerCase()}: {suitDomainPlain(suit)}.
            </li>
          ))}
        </ul>
        <p className="prose-reading mt-3 text-mist">
          Every suit-and-rank combination has its own full page —{" "}
          <Link href="/birth-card" className="text-gold underline underline-offset-4">
            all 52 card meanings
          </Link>{" "}
          — each written in three ranges: balanced, under-expressed, and
          over-expressed. That three-range structure is what this site uses
          instead of tarot-style reversals.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">What do the ranks mean, Ace through King?</h2>
        <p className="prose-reading mb-2 text-mist">
          The rank is the move. The thirteen ranks run one arc — a theme is
          born at the Ace, matures through the numbers, and is mastered by the
          court cards:
        </p>
        <ul className="prose-reading space-y-1.5 text-mist">
          {RANKS.map((rank) => (
            <li key={rank}>
              <strong>{RANK_LABEL[rank] ?? rank}</strong> — {rankTheme(rank)}
            </li>
          ))}
        </ul>
        <p className="prose-reading mt-3 text-mist">
          Suit times rank is the whole grammar. The same move lands
          differently by arena: the{" "}
          <Link href="/birth-card/ace-of-hearts" className="text-gold underline underline-offset-4">
            Ace of Hearts
          </Link>{" "}
          is initiation in relationships and emotion, while the{" "}
          <Link href="/birth-card/king-of-spades" className="text-gold underline underline-offset-4">
            King of Spades
          </Link>{" "}
          is mature command in work, will, and transformation. Read any card by
          asking those two questions — which arena, which move — and you can
          read all 52.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">How do you do your first reading? Five steps</h2>
        <ol className="prose-reading list-decimal space-y-2 pl-5 text-mist">
          <li>
            <strong>Settle one real question.</strong> Not &ldquo;tell me
            everything&rdquo; — one situation you actually care about. Write it
            down before you shuffle.
          </li>
          <li>
            <strong>Shuffle until the question stops feeling urgent.</strong>{" "}
            There is no correct technique; the shuffle is just how a drawn
            reading chooses its cards.
          </li>
          <li>
            <strong>Draw three cards, left to right, face up.</strong> Give
            each a job before you look: past, present, future. This layout is
            the{" "}
            <Link href="/playing-card-spreads/three-card" className="text-gold underline underline-offset-4">
              three-card spread
            </Link>
            , the one beginners should learn first.
          </li>
          <li>
            <strong>Read each card as suit plus rank.</strong> The suit names
            the arena, the rank names the move. A 5 of Hearts in the past:
            freedom and change moved through your relationships. A King of
            Spades in the present: mature command is being asked of your work.
          </li>
          <li>
            <strong>Write the sentence the three cards make — then test it.</strong>{" "}
            Against the real week, the real person, the real decision. A card
            reading is a mirror for noticing patterns, not a forecast; if it
            clarifies nothing real, discard it.
          </li>
        </ol>
        <p className="prose-reading mt-3 text-mist">
          When you are ready for more layouts — a relationship spread, a
          yes-or-no draw — the{" "}
          <Link href={SPREADS_HUB_PATH} className="text-gold underline underline-offset-4">
            playing card spreads guide
          </Link>{" "}
          covers the three worth knowing.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">Shuffled draws or the deterministic method?</h2>
        <p className="prose-reading text-mist">
          Everything above is the shuffled branch of cartomancy: the cards fall
          where they fall, and ask the same question tomorrow and you will draw
          different cards. That is not a flaw — it is the method, and it suits
          open questions read in the moment.
        </p>
        <p className="prose-reading mt-3 text-mist">
          Cardology, the system this site documents, is the other branch. It
          removes the shuffle entirely: a fixed formula maps your birthday to
          exactly one of the 52 cards — your birth card — and the same birthday
          returns the same card every time, for any reader. No spread, no
          draw, nothing to learn before you start. The full split is explained
          in{" "}
          <Link href="/cartomancy-vs-tarot" className="text-gold underline underline-offset-4">
            cartomancy vs tarot
          </Link>
          ; the fastest way to feel the difference is to run your own birthday
          through the{" "}
          <Link href="/birth-card-calculator" className="text-gold underline underline-offset-4">
            birth card calculator
          </Link>{" "}
          — or see which card sits on today&rsquo;s date at the{" "}
          <Link href="/card-of-the-day" className="text-gold underline underline-offset-4">
            card of the day
          </Link>
          .
        </p>
      </section>

      <section className="card-surface mt-10 rounded-2xl p-5">
        <p className="font-serif text-base text-bone">Skip the learning curve</p>
        <p className="mt-1 text-sm text-faint">
          Learning the 52 takes months. The AI reader already knows them — call
          and it reads your first card free, on the spot. Or start with the
          card your birthday already picked.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Link href="/birth-card-calculator" className="inline-block rounded-full bg-foil px-5 py-2 font-serif text-sm text-ink">
            Birth Card Calculator →
          </Link>
          <a href={READER_PHONE_TEL} className="text-sm font-bold text-gold underline underline-offset-4">
            Call the AI reader free: {READER_PHONE_DISPLAY}
          </a>
        </div>
        <p className="mt-3 text-xs text-faint">
          Want it daily? See the{" "}
          <Link href={TRIAL_PATH} className="text-gold underline underline-offset-4">{TRIAL_NAME}</Link>.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">Frequently asked questions</h2>
        <div className="space-y-5">
          {faqs.map((f) => (
            <div key={f.q}>
              <h3 className="prose-reading mb-1 font-serif text-bone">{f.q}</h3>
              <p className="prose-reading text-mist">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <ReadingBridge variant="general" className="mt-10" />

      <p className="mt-6 text-sm">
        <Link href={SPREADS_HUB_PATH} className="text-gold underline underline-offset-4">Playing card spreads →</Link>
        {"  ·  "}
        <Link href="/cartomancy-vs-tarot" className="text-gold underline underline-offset-4">Cartomancy vs tarot →</Link>
        {"  ·  "}
        <Link href="/what-is-cardology" className="text-gold underline underline-offset-4">What is Cardology? →</Link>
        {"  ·  "}
        <Link href="/birth-card" className="text-gold underline underline-offset-4">All 52 card meanings →</Link>
      </p>
    </SeoShell>
  );
}
