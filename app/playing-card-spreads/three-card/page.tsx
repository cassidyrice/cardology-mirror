import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { ReadingBridge } from "@/components/seo/ReadingBridge";
import { READER_PHONE_DISPLAY, READER_PHONE_TEL } from "@/lib/offers";
import { SITE_URL } from "@/lib/site";
import { getCardSeo, type CardSeo } from "@/lib/seo-cards";
import { rankTheme, suitWord, SPREADS, SPREADS_HUB_PATH } from "@/lib/spreads";

export const metadata: Metadata = {
  title: "Three-Card Spread With Playing Cards: Past, Present, Future",
  description:
    "How to read a three-card playing card spread: the past-present-future and situation-action-outcome variants, step-by-step instructions, and a worked example.",
  alternates: { canonical: "/playing-card-spreads/three-card" },
  openGraph: {
    title: "Three-Card Spread With Playing Cards: Past, Present, Future",
    description:
      "The first spread to learn with a 52-card deck: both classic variants, a step-by-step method, and a worked example read from real card meanings.",
    url: "/playing-card-spreads/three-card",
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Card Blueprints" }],
  },
};

// Worked-example cards, pulled from the site's own data layer at build time —
// the example's meanings are the same strings the full card pages publish.
function mustCard(code: string): CardSeo {
  const card = getCardSeo(code);
  if (!card) throw new Error(`Missing card data for ${code}`);
  return card;
}

export default function ThreeCardSpread() {
  const past = mustCard("5♥");
  const present = mustCard("8♣");
  const future = mustCard("2♦");

  const faqs = [
    {
      q: "What are the positions in a three-card spread?",
      a: "Past, present, future is the classic timeline frame: where the situation came from, where it stands, where it leans. Situation, action, outcome is the decision frame: what is actually going on, what you could do, what that path tends toward. Pick the frame before you shuffle — choosing it after you see the cards is how wishful readings happen.",
    },
    {
      q: "Do you read reversed cards in a playing card spread?",
      a: "You can, but this site's system doesn't use reversals. Every card meaning here is written in three ranges instead — balanced, under-expressed, and over-expressed — which does the work reversals do in tarot: the same card can name the gift, the deficit, or the excess of one pattern.",
    },
    {
      q: "Can I ask the same question twice?",
      a: "You can, and you will get different cards — that is what a shuffle is. A drawn spread reads the moment, not the record. If you want an answer that holds still, that is the deterministic side of cartomancy: your birth card is fixed by your birthday and returns the same result every time.",
    },
  ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Playing Card Spreads", item: `${SITE_URL}${SPREADS_HUB_PATH}` },
        { "@type": "ListItem", position: 3, name: "Three-Card Spread", item: `${SITE_URL}/playing-card-spreads/three-card` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];

  const siblings = SPREADS.filter((s) => s.slug !== "three-card");

  return (
    <SeoShell
      crumb={[
        { label: "Home", href: "/" },
        { label: "Playing Card Spreads", href: SPREADS_HUB_PATH },
        { label: "Three-Card Spread", href: "/playing-card-spreads/three-card" },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h1 className="display mb-3 text-3xl text-bone">The Three-Card Spread</h1>
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5" data-ai-summary>
        <p className="eyebrow mb-2 text-gold">Direct answer</p>
        <p className="prose-reading text-mist">
          Shuffle, draw three cards, lay them left to right, and give each a
          job: past, present, future — or situation, action, outcome. Read
          each card as suit (the arena) plus rank (the move), then read the
          row as one sentence.
        </p>
      </div>
      <p className="prose-reading mb-6 text-mist">
        Three cards is the smallest layout that tells a story: a beginning, a
        middle, and a lean. If the vocabulary below is new — suits as arenas,
        ranks as moves — read{" "}
        <Link href="/how-to-read-playing-cards" className="text-gold underline underline-offset-4">
          how to read playing cards
        </Link>{" "}
        first; this page assumes it and adds the layout.
      </p>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">Which frame: timeline or decision?</h2>
        <p className="prose-reading text-mist">
          <strong>Past · Present · Future</strong> is the timeline frame. Use
          it when the question is a situation unfolding — a job, a move, a
          slow-burning conflict. The positions ask: what fed this, what is true
          now, where does it lean if nothing changes.
        </p>
        <p className="prose-reading mt-3 text-mist">
          <strong>Situation · Action · Outcome</strong> is the decision frame.
          Use it when you hold a choice. The positions ask: what is actually
          going on, what move is available to you, and what that move tends
          toward. Same three cards, different jobs — which is why you commit to
          a frame <em>before</em> the shuffle. Choosing the frame after you see
          the cards is how wishful readings happen.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">How do you read it, step by step?</h2>
        <ol className="prose-reading list-decimal space-y-2 pl-5 text-mist">
          <li>Write down one real question, and pick your frame — timeline or decision.</li>
          <li>Shuffle until the question stops feeling urgent in your hands.</li>
          <li>Draw three cards and lay them left to right, face up.</li>
          <li>
            Read each card alone first: suit names the arena — Hearts for
            relationships and emotion, Clubs for mind and communication,
            Diamonds for values and resources, Spades for work, will, and
            transformation — and rank names the move, Ace through King.
          </li>
          <li>
            Check each card&rsquo;s range. Every meaning on this site is
            written three ways — balanced, under-expressed, over-expressed —
            so ask which version you are living. The card&rsquo;s own page
            spells all three out.
          </li>
          <li>Read the row as one sentence, write it down, and test it against the actual week.</li>
        </ol>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">A worked example</h2>
        <p className="prose-reading text-mist">
          Question: &ldquo;Where is my work life heading?&rdquo; — timeline
          frame. The shuffle gives the {past.label}, the {present.label}, and
          the {future.label}. Here is how each card reads, using the same
          meanings their full pages carry:
        </p>
        <div className="mt-4 flex gap-3">
          {[past, present, future].map((c) => (
            <img
              key={c.slug}
              src={`/pins/${c.slug}.png`}
              alt={`${c.label} playing card`}
              width={1000}
              height={1500}
              loading="lazy"
              decoding="async"
              className="w-24 rounded-2xl border border-white/10 sm:w-28"
            />
          ))}
        </div>
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="eyebrow mb-1 text-gold">
              Past — {past.label}{past.title ? ` · ${past.title}` : ""}
            </p>
            <p className="prose-reading mb-0 text-mist">
              A {suitWord(past.suit)} card, so the chapter behind you ran on{" "}
              {past.suitDomain.toLowerCase()}; the rank carries{" "}
              {rankTheme(past.rank)}. In balance it reads: {past.sweetSpot}{" "}
              Restlessness got you here — feelings kept moving.{" "}
              <Link href={`/birth-card/${past.slug}`} className="text-gold underline underline-offset-4">
                Full {past.label} meaning →
              </Link>
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="eyebrow mb-1 text-gold">
              Present — {present.label}{present.title ? ` · ${present.title}` : ""}
            </p>
            <p className="prose-reading mb-0 text-mist">
              A {suitWord(present.suit)} card: the live arena is{" "}
              {present.suitDomain.toLowerCase()}, and the rank carries{" "}
              {rankTheme(present.rank)}. In balance: {present.sweetSpot} The
              over-expressed range is the caution — {present.over} That is the
              edge to watch this month.{" "}
              <Link href={`/birth-card/${present.slug}`} className="text-gold underline underline-offset-4">
                Full {present.label} meaning →
              </Link>
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="eyebrow mb-1 text-gold">
              Future — {future.label}{future.title ? ` · ${future.title}` : ""}
            </p>
            <p className="prose-reading mb-0 text-mist">
              A {suitWord(future.suit)} card, so the lean is toward{" "}
              {future.suitDomain.toLowerCase()}, with the rank&rsquo;s theme of{" "}
              {rankTheme(future.rank)}. In balance: {future.sweetSpot}{" "}
              <Link href={`/birth-card/${future.slug}`} className="text-gold underline underline-offset-4">
                Full {future.label} meaning →
              </Link>
            </p>
          </div>
        </div>
        <p className="prose-reading mt-4 text-mist">
          Read as one sentence: a restless, feeling-driven chapter is behind
          you; you hold real mental authority right now, with a warning about
          how you wield it; and what is forming next is a fair, two-sided
          exchange around money and value. That is a testable description of a
          work life — which is all a spread should claim to be.
        </p>
        <p className="mt-3 text-sm text-faint">
          A mirror, not a forecast: the spread describes a pattern in play, not
          events on a schedule. Draw again tomorrow and the cards will differ —
          that is the shuffle&rsquo;s nature, not a malfunction. If a reading
          clarifies nothing real, discard it.
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
        <p className="font-serif text-base text-bone">One card that never shuffles</p>
        <p className="mt-1 text-sm text-faint">
          Before you learn spreads, meet the card your birthday already fixed —
          or call and the AI reader reads it to you free.
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
        <Link href={SPREADS_HUB_PATH} className="text-gold underline underline-offset-4">All playing card spreads →</Link>
        {"  ·  "}
        {siblings.map((s) => (
          <span key={s.slug}>
            <Link href={s.path} className="text-gold underline underline-offset-4">{s.name} →</Link>
            {"  ·  "}
          </span>
        ))}
        <Link href="/how-to-read-playing-cards" className="text-gold underline underline-offset-4">How to read playing cards →</Link>
      </p>
    </SeoShell>
  );
}
