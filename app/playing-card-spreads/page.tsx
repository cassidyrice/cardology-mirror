import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { ReadingBridge } from "@/components/seo/ReadingBridge";
import { READER_PHONE_DISPLAY, READER_PHONE_TEL } from "@/lib/offers";
import { SPREADS, SPREADS_HUB_PATH } from "@/lib/spreads";

export const metadata: Metadata = {
  title: "Playing Card Spreads: The Three Layouts Beginners Need",
  description:
    "The three playing card spreads a beginner needs — three-card, love, and yes-or-no — when to use each, and the Cardology alternative that needs no spread at all.",
  alternates: { canonical: SPREADS_HUB_PATH },
  openGraph: {
    title: "Playing Card Spreads: The Three Layouts Beginners Need",
    description:
      "Three-card, love, and yes-or-no spreads for a standard 52-card deck — when to use each, and the deterministic method that skips spreads entirely.",
    url: SPREADS_HUB_PATH,
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Card Blueprints" }],
  },
};

export default function PlayingCardSpreads() {
  const faqs = [
    {
      q: "What is the best playing card spread for beginners?",
      a: "The three-card spread. Three named positions — past, present, future, or situation, action, outcome — give a draw enough structure to read as a story while staying small enough to finish. Learn it first; the love spread and the yes-or-no reading are variations on the same skill.",
    },
    {
      q: "Do playing card spreads work like tarot spreads?",
      a: "Yes. A spread is just a set of labeled positions, and positions don't care which deck you deal from. Any tarot layout can be dealt from a 52-card deck: Cups become Hearts, Wands become Clubs, Pentacles become Diamonds, Swords become Spades. Only the 22 Major Arcana have no playing-card equivalent.",
    },
    {
      q: "How many cards should a beginner draw?",
      a: "Three. One card gives you a word when you need a sentence, and big layouts drown a beginner in cross-references. Three cards in named positions read as a beginning, a middle, and an end. If you want a starting point that needs no draw at all, your birth card is one card that never changes.",
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
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "Playing Card Spreads", href: SPREADS_HUB_PATH }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />

      <h1 className="display mb-3 text-3xl text-bone">Playing Card Spreads</h1>
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5" data-ai-summary>
        <p className="eyebrow mb-2 text-gold">Direct answer</p>
        <p className="prose-reading text-mist">
          A spread is a fixed layout of drawn cards in which each position asks
          one question. Beginners need three: the three-card spread, a simple
          love spread, and yes-or-no. Cardology — this site&rsquo;s method —
          skips spreads entirely: a fixed formula turns your birthday into your
          card.
        </p>
      </div>
      <p className="prose-reading mb-6 text-mist">
        Most spread guides list twenty layouts because twenty ranks better than
        three. You need three. Each one below has its own step-by-step page
        with a worked example read from this site&rsquo;s actual card meanings —
        and if you have never read a card before, start with the vocabulary in{" "}
        <Link href="/how-to-read-playing-cards" className="text-gold underline underline-offset-4">
          how to read playing cards
        </Link>{" "}
        first: suit is the arena, rank is the move.
      </p>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">What is a playing card spread?</h2>
        <p className="prose-reading text-mist">
          A spread is a set of labeled positions you deal shuffled cards into —
          &ldquo;past,&rdquo; &ldquo;you,&rdquo; &ldquo;the connection.&rdquo;
          The position frames the question; the card supplies the answer&rsquo;s
          raw material in suit and rank. That is the entire technology, and it
          is deck-agnostic: any tarot layout deals just as well from the 52.
          What a spread cannot do is hold still — shuffle again and the same
          question gets different cards, which is why this site also documents
          a method with no shuffle in it at all.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">Which spreads should you learn?</h2>
        <div className="space-y-4">
          {SPREADS.map((s) => (
            <Link
              key={s.slug}
              href={s.path}
              className="card-surface block rounded-2xl p-5 transition hover:-translate-y-0.5"
            >
              <p className="font-serif text-lg text-bone">{s.name}</p>
              <p className="eyebrow mt-1 text-gold">{s.positions}</p>
              <p className="mt-2 text-sm text-mist">{s.oneLine}</p>
              <p className="mt-2 text-sm text-faint">Best for: {s.bestFor}</p>
              <p className="mt-3 text-sm font-bold text-gold">Learn the spread →</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">When should you use which?</h2>
        <p className="prose-reading text-mist">
          Use the{" "}
          <Link href="/playing-card-spreads/three-card" className="text-gold underline underline-offset-4">
            three-card spread
          </Link>{" "}
          for anything with a timeline in it — where a situation came from,
          where it stands, where it leans. Use the{" "}
          <Link href="/playing-card-spreads/love" className="text-gold underline underline-offset-4">
            love spread
          </Link>{" "}
          when the question is a specific relationship, because it separates
          the two people from the bond between them. Reach for the{" "}
          <Link href="/playing-card-spreads/yes-or-no" className="text-gold underline underline-offset-4">
            yes-or-no reading
          </Link>{" "}
          last and lightly: a one-card verdict is the weakest thing a deck can
          do, and its page explains honestly why — and what to do instead when
          the decision actually matters.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">What if the answer shouldn&rsquo;t change every shuffle?</h2>
        <p className="prose-reading text-mist">
          Every spread on this page is the shuffled branch of cartomancy.
          Cardology — the system the rest of this site documents — needs no
          spread, because nothing is drawn: a fixed formula maps your birthday
          to exactly one of the 52 cards, and the same birthday returns the
          same card every time, for any reader. Your first &ldquo;reading&rdquo;
          takes one lookup in the{" "}
          <Link href="/birth-card-calculator" className="text-gold underline underline-offset-4">
            birth card calculator
          </Link>
          , and the calendar version of the same math puts one fixed card on
          every date — today&rsquo;s is at the{" "}
          <Link href="/card-of-the-day" className="text-gold underline underline-offset-4">
            card of the day
          </Link>
          . How the two branches relate is covered in{" "}
          <Link href="/cartomancy-vs-tarot" className="text-gold underline underline-offset-4">
            cartomancy vs tarot
          </Link>
          .
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

      <div className="card-surface mt-6 rounded-2xl p-5">
        <p className="font-serif text-base text-bone">No spread required</p>
        <p className="mt-1 text-sm text-faint">
          Your birthday already picked your card. Look it up free — or call and
          the AI reader reads your first card on the spot.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Link href="/birth-card-calculator" className="inline-block rounded-full bg-foil px-5 py-2 font-serif text-sm text-ink">
            Birth Card Calculator →
          </Link>
          <a href={READER_PHONE_TEL} className="text-sm font-bold text-gold underline underline-offset-4">
            Call the AI reader free: {READER_PHONE_DISPLAY}
          </a>
        </div>
      </div>

      <p className="mt-6 text-sm">
        <Link href="/how-to-read-playing-cards" className="text-gold underline underline-offset-4">How to read playing cards →</Link>
        {"  ·  "}
        <Link href="/cartomancy-vs-tarot" className="text-gold underline underline-offset-4">Cartomancy vs tarot →</Link>
        {"  ·  "}
        <Link href="/card-of-the-day" className="text-gold underline underline-offset-4">Card of the day →</Link>
        {"  ·  "}
        <Link href="/birth-card" className="text-gold underline underline-offset-4">All 52 card meanings →</Link>
      </p>
    </SeoShell>
  );
}
