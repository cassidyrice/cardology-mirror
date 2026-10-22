import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { SUIT_COLOR_PAPER, SUIT_DOMAIN, SUIT_GLYPH, type Suit } from "@/lib/cards";
import { rankTheme, suitDomainPlain, SPREADS_HUB_PATH } from "@/lib/spreads";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { serializeJsonLdForHtml } from "@/lib/structured-data";
import { PAGE_UPDATED_DATES } from "@/lib/page-dates";
import { updatedLabel } from "@/lib/page-updated";

const UPDATED = PAGE_UPDATED_DATES["/how-to-read-playing-cards"];

const TITLE = "Playing Card Meaning: How to Read a Deck";
const DESCRIPTION =
  "Playing card meaning by suit and rank: Hearts, Clubs, Diamonds, Spades, Ace to King. A five-step first reading. And when to stop shuffling.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/how-to-read-playing-cards" },
  openGraph: {
    siteName: SITE_NAME,
    title: "Playing Card Meaning: How to Read a Deck",
    description:
      "Playing card meaning by suit and rank, plus your first reading in five steps. An ordinary 52-card deck. Playing cards, not tarot.",
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
      q: "What does a playing card meaning include?",
      a: "A playing card meaning is suit plus rank. The suit names the arena of life: Hearts, Clubs, Diamonds, Spades. The rank names the move inside that arena, Ace through King. On this site each of the 52 cards also has a full birth-card page with balanced, under-expressed and over-expressed ranges. Three versions of you. Pick the honest one.",
    },
    {
      q: "Can you do tarot spreads with playing cards instead of tarot cards?",
      a: "Yes. Spread positions do not care which deck you deal them from, so any tarot layout works with 52 cards. The suits translate directly. Cups become Hearts. Wands become Clubs. Pentacles become Diamonds. Swords become Spades. You lose the 22 Major Arcana and one court card per suit. Playing-card cartomancy traditions just work without them. Nobody misses the Tower.",
    },
    {
      q: "What does each suit mean?",
      a: "Hearts govern relationships and emotion. Clubs govern mind and communication. Diamonds govern values and resources. Spades govern work, will and transformation. The suit names the arena of life a card is talking about. The rank names the move being made there. Usually the move you keep making.",
    },
    {
      q: "Do I need a special deck?",
      a: "No. Any standard 52-card deck works. The meanings live in the deck's structure of suits and ranks, not in the artwork. Do not buy a new deck to avoid starting. Set the Jokers aside for spread work. In Cardology the Joker belongs only to people born on December 31.",
    },
    {
      q: "How do you start reading playing cards?",
      a: "Start with one real question and a three-card draw. Shuffle. Lay three cards left to right as past, present and future. Read each card as its suit, the arena, plus its rank, the move. Write down the sentence the three cards make. Test it against your actual week, not the week you wish you had.",
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

  const pageUrl = `${SITE_URL}/how-to-read-playing-cards`;
  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "How to Read Playing Cards",
    description: DESCRIPTION,
    url: pageUrl,
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
    datePublished: "2026-07-12",
    dateModified: UPDATED,
    author: {
      "@type": "Person",
      name: "Cassidy Rice",
      url: `${SITE_URL}/about`,
    },
    publisher: { "@id": `${SITE_URL}/#organization` },
  };

  return (
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "How to Read Playing Cards", href: "/how-to-read-playing-cards" }]}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLdForHtml([article, faq]),
        }}
      />

      <h1 className="display mb-3 text-3xl text-brand-ink">How to Read Playing Cards</h1>
      <p className="mb-4 text-xs text-brand-ink-soft">
        By{" "}
        <Link href="/about" className="text-brand-oxblood underline underline-offset-4">
          Cassidy Rice
        </Link>{" "}
        · Updated {updatedLabel(UPDATED)} ·{" "}
        <Link href="/methodology" className="text-brand-oxblood underline underline-offset-4">
          Methodology
        </Link>
      </p>
      <div className="mb-6 rounded-2xl border border-brand-line bg-brand-ivory/70 p-5" data-ai-summary>
        <p className="type-eyebrow mb-2 !text-brand-bronze">Direct answer</p>
        <p className="prose-reading text-brand-ink-soft">
          A playing card meaning is suit plus rank. The suit is the arena of
          life. The rank is the move being made in it. Then either shuffle and
          draw a spread, or calculate the deterministic birth card from a
          birthday. Two doors. Stop standing in the hallway.
        </p>
      </div>
      <p className="prose-reading mb-6 text-brand-ink-soft">
        Cartomancy with playing cards is older than tarot&rsquo;s fame and
        needs none of its equipment. The deck in your junk drawer already
        carries the whole system. Four suits for the four arenas of a life.
        Thirteen ranks for the moves made inside them. This page teaches the
        vocabulary and walks you through a first reading. Then it shows you
        the shortcut this site is built on, where nobody shuffles at all.
      </p>

      <section className="mt-8">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">Playing card meaning by suit and rank</h2>
        <p className="prose-reading text-brand-ink-soft">
          A playing card meaning does not come from a guidebook picture. It
          comes from two facts printed on the card: which suit, which rank.
          Suit names the arena. Rank names the move. That is the whole grammar
          of cartomancy with a standard deck. You were overcomplicating it.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">What do you need to start?</h2>
        <p className="prose-reading text-brand-ink-soft">
          A standard 52-card deck and something to write with. That is the
          entire kit. No candles required. The meanings live in the
          deck&rsquo;s structure, which suit and which rank, not in special
          artwork. A casino deck reads as well as an heirloom. Set the Jokers
          aside for spread work. In Cardology the Joker belongs only to people
          born on December 31. Wondering about playing cards versus tarot? The
          suits map one to one. The full comparison lives at{" "}
          <Link href="/cartomancy-vs-tarot" className="text-brand-oxblood underline underline-offset-4">
            cartomancy vs tarot
          </Link>
          .
        </p>
      </section>

      <section className="mt-8">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">What does each suit mean?</h2>
        <p className="prose-reading mb-2 text-brand-ink-soft">
          The suit is the arena. The part of life a card is talking about,
          whether you wanted to talk about it or not. These four domains are
          the same ones every card page on this site is built from:
        </p>
        <ul className="prose-reading space-y-2 text-brand-ink-soft">
          {SUITS.map((suit) => (
            <li key={suit}>
              <span style={{ color: SUIT_COLOR_PAPER[suit] }}>
                {SUIT_GLYPH[suit]} {suit.charAt(0).toUpperCase() + suit.slice(1)}
              </span>
              : {SUIT_DOMAIN[suit].toLowerCase()}. {suitDomainPlain(suit)}.
            </li>
          ))}
        </ul>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          Every suit-and-rank combination has its own full page:{" "}
          <Link href="/birth-card" className="text-brand-oxblood underline underline-offset-4">
            all 52 card meanings
          </Link>
          . Each is written in three ranges: balanced, under-expressed and
          over-expressed. This site uses that three-range structure instead of
          tarot-style reversals. Upside down was never the problem. You were.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">What do the ranks mean, Ace through King?</h2>
        <p className="prose-reading mb-2 text-brand-ink-soft">
          The rank is the move. The thirteen ranks run one arc. A theme is
          born at the Ace. It matures through the numbers. The court cards
          master it, eventually, after several embarrassing drafts:
        </p>
        <ul className="prose-reading space-y-1.5 text-brand-ink-soft">
          {RANKS.map((rank) => (
            <li key={rank}>
              <strong>{RANK_LABEL[rank] ?? rank}</strong>: {rankTheme(rank)}
            </li>
          ))}
        </ul>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          Suit times rank is the whole grammar. The same move lands
          differently by arena. The{" "}
          <Link href="/birth-card/ace-of-hearts" className="text-brand-oxblood underline underline-offset-4">
            Ace of Hearts
          </Link>{" "}
          is initiation in relationships and emotion, while the{" "}
          <Link href="/birth-card/king-of-spades" className="text-brand-oxblood underline underline-offset-4">
            King of Spades
          </Link>{" "}
          is mature command in work, will and transformation. Ask two
          questions of any card. Which arena. Which move. Then you can read
          all 52. Even the ones you avoid.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">How do you do your first reading? Five steps</h2>
        <ol className="prose-reading list-decimal space-y-2 pl-5 text-brand-ink-soft">
          <li>
            <strong>Settle one real question.</strong> Not &ldquo;tell me
            everything.&rdquo; One situation you actually care about. Not the
            one you are pretending not to care about. Okay, that one. Write it
            down before you shuffle.
          </li>
          <li>
            <strong>Shuffle until the question stops feeling urgent.</strong>{" "}
            There is no correct technique. The shuffle is just how a drawn
            reading chooses its cards. It is not judging your form.
          </li>
          <li>
            <strong>Draw three cards, left to right, face up.</strong> Give
            each a job before you look: past, present, future. No reassigning
            jobs after you see them. This layout is the{" "}
            <Link href="/playing-card-spreads" className="text-brand-oxblood underline underline-offset-4">
              playing board guide
            </Link>
            , the one beginners learn first.
          </li>
          <li>
            <strong>Read each card as suit plus rank.</strong> The suit names
            the arena. The rank names the move. A 5 of Hearts in the past:
            freedom and change moved through your relationships. A King of
            Spades in the present: your work is asking for mature command. It
            has asked before.
          </li>
          <li>
            <strong>Write the sentence the three cards make. Then test it.</strong>{" "}
            Against the real week, the real person, the real decision. A card
            reading is a mirror for noticing patterns, not a forecast. If it
            clarifies nothing real, discard it. Do not redraw until it agrees
            with you.
          </li>
        </ol>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          Ready for more layouts? A relationship spread, a yes-or-no draw.
          The{" "}
          <Link href={SPREADS_HUB_PATH} className="text-brand-oxblood underline underline-offset-4">
            playing card spreads guide
          </Link>{" "}
          covers the three worth knowing. The rest are decoration.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">Shuffled draws or the deterministic method?</h2>
        <p className="prose-reading text-brand-ink-soft">
          Everything above is the shuffled branch of cartomancy. The cards
          fall where they fall. Ask the same question tomorrow and different
          cards come up. That is not a flaw. It is the method. It suits open
          questions read in the moment.
        </p>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          Cardology, the system this site documents, is the other branch. It
          removes the shuffle entirely. A fixed formula maps your birthday to
          exactly one of the 52 cards, your birth card. The same birthday
          returns the same card every time, for any reader. No spread. No
          draw. Nothing to learn before you start. No excuse, then. The full
          split is explained in{" "}
          <Link href="/cartomancy-vs-tarot" className="text-brand-oxblood underline underline-offset-4">
            cartomancy vs tarot
          </Link>
          . The fastest way to feel the difference is to run your own birthday
          through the{" "}
          <Link href="/birth-card-calculator" className="text-brand-oxblood underline underline-offset-4">
            birth card calculator
          </Link>
          . Or see which card sits on today&rsquo;s date at the{" "}
          <Link href="/card-of-the-day" className="text-brand-oxblood underline underline-offset-4">
            card of the day
          </Link>
          .
        </p>
      </section>

      <section className="card-surface mt-10 rounded-2xl p-5">
        <p className="font-serif text-base text-brand-ink">Skip the learning curve. You were going to anyway.</p>
        <p className="mt-1 text-sm text-brand-ink-soft">
          Learning the 52 takes time. You have abandoned hobbies faster.
          Start with the card your birthday already picked. Then use its full
          meaning page as your reference.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Link href="/birth-card-calculator" className="ink-button">
            Birth Card Calculator →
          </Link>

        </div>
      </section>

      <section className="mt-8">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">Frequently asked questions</h2>
        <div className="space-y-5">
          {faqs.map((f) => (
            <div key={f.q}>
              <h3 className="prose-reading mb-1 font-serif text-brand-ink">{f.q}</h3>
              <p className="prose-reading text-brand-ink-soft">{f.a}</p>
            </div>
          ))}
        </div>
      </section>


      <p className="mt-6 text-sm">
        <Link href={SPREADS_HUB_PATH} className="text-brand-oxblood underline underline-offset-4">Playing card spreads →</Link>
        {"  ·  "}
        <Link href="/cartomancy-vs-tarot" className="text-brand-oxblood underline underline-offset-4">Cartomancy vs tarot →</Link>
        {"  ·  "}
        <Link href="/what-is-cardology" className="text-brand-oxblood underline underline-offset-4">What is Cardology? →</Link>
        {"  ·  "}
        <Link href="/birth-card" className="text-brand-oxblood underline underline-offset-4">All 52 card meanings →</Link>
      </p>
    </SeoShell>
  );
}
