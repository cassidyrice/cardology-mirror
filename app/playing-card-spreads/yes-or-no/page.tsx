import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { ReadingBridge } from "@/components/seo/ReadingBridge";
import { READER_PHONE_DISPLAY, READER_PHONE_TEL } from "@/lib/offers";
import { READINGS_PATH, SITE_URL } from "@/lib/site";
import { SUIT_COLOR, SUIT_GLYPH } from "@/lib/cards";
import { getCardSeo, type CardSeo } from "@/lib/seo-cards";
import { rankTheme, SPREADS, SPREADS_HUB_PATH } from "@/lib/spreads";

export const metadata: Metadata = {
  title: "Yes or No Playing Card Reading: The Honest Version",
  description:
    "How yes-or-no playing card readings traditionally work — red for yes, black for no, suits for nuance — and what a one-card draw honestly can and cannot tell you.",
  alternates: { canonical: "/playing-card-spreads/yes-or-no" },
  openGraph: {
    title: "Yes or No Playing Card Reading: The Honest Version",
    description:
      "Red for yes, black for no, suits for nuance — the traditional method, plus the honest claim boundary most spread guides leave out.",
    url: "/playing-card-spreads/yes-or-no",
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Card Blueprints" }],
  },
};

// Both Aces, from the site's own data layer — used to show how the same rank
// changes meaning by suit. No meanings are authored on this page.
function mustCard(code: string): CardSeo {
  const card = getCardSeo(code);
  if (!card) throw new Error(`Missing card data for ${code}`);
  return card;
}

export default function YesOrNoReading() {
  const aceHearts = mustCard("A♥");
  const aceSpades = mustCard("A♠");

  const faqs = [
    {
      q: "Which playing cards mean yes and which mean no?",
      a: "In the common tradition, red cards (Hearts and Diamonds) mean yes and black cards (Clubs and Spades) mean no. The suit adds nuance: Hearts lean toward a yes about feeling, Diamonds toward a practical yes with conditions, Clubs toward a not-yet that wants more thought or conversation, Spades toward a no as things stand — or a yes priced in real work.",
    },
    {
      q: "Are yes or no card readings accurate?",
      a: "A shuffled one-card draw is structured chance — treated as a verdict, it is a coin flip with better costume. This site treats cards as pattern language, not prediction, so the honest use is as a prompt: notice whether the draw relieved or disappointed you. That reaction is real information; the card's color is not.",
    },
    {
      q: "How many cards do you draw for a yes or no reading?",
      a: "One card for a quick answer, or three with majority rules — two or more red is yes, two or more black is no. Three draws soften the coin-flip feel and let the suits add texture, but they do not change what the method is underneath.",
    },
  ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Playing Card Spreads", item: `${SITE_URL}${SPREADS_HUB_PATH}` },
        { "@type": "ListItem", position: 3, name: "Yes-or-No Reading", item: `${SITE_URL}/playing-card-spreads/yes-or-no` },
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

  const siblings = SPREADS.filter((s) => s.slug !== "yes-or-no");

  return (
    <SeoShell
      crumb={[
        { label: "Home", href: "/" },
        { label: "Playing Card Spreads", href: SPREADS_HUB_PATH },
        { label: "Yes-or-No Reading", href: "/playing-card-spreads/yes-or-no" },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h1 className="display mb-3 text-3xl text-bone">Yes-or-No Card Readings</h1>
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5" data-ai-summary>
        <p className="eyebrow mb-2 text-gold">Direct answer</p>
        <p className="prose-reading text-mist">
          Traditionally: draw one card — red (Hearts, Diamonds) means yes,
          black (Clubs, Spades) means no — or draw three and let the majority
          rule. Honestly: a shuffled draw is structured chance. This site
          treats cards as pattern language, not prediction, so read the draw
          as a prompt, not a verdict.
        </p>
      </div>
      <p className="prose-reading mb-6 text-mist">
        This is the most-searched playing card spread and the one most guides
        are least honest about. Here is the traditional method in full, what
        the suits genuinely add, and where the claim has to stop — in that
        order.
      </p>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">How is a yes-or-no reading traditionally done?</h2>
        <p className="prose-reading text-mist">
          Hold one closed question — answerable with yes or no — shuffle, and
          cut to a single card. Red answers yes; black answers no. For more
          texture, draw three cards instead and let the majority rule: two or
          more red is a yes, two or more black is a no. That is the entire
          mechanism. Everything else a reader adds comes from the suit and
          rank of what turns up — the same vocabulary taught in{" "}
          <Link href="/how-to-read-playing-cards" className="text-gold underline underline-offset-4">
            how to read playing cards
          </Link>
          .
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">How do the suits shade the answer?</h2>
        <p className="prose-reading mb-2 text-mist">
          The color gives the verdict; the suit says what kind. Read through
          the four domains every card page on this site uses:
        </p>
        <ul className="prose-reading space-y-2 text-mist">
          <li>
            <span style={{ color: SUIT_COLOR.hearts }}>{SUIT_GLYPH.hearts} Hearts</span>{" "}
            — relationships &amp; emotion: a yes about feeling. The heart is
            already leaning in, whatever the logistics say.
          </li>
          <li>
            <span style={{ color: SUIT_COLOR.diamonds }}>{SUIT_GLYPH.diamonds} Diamonds</span>{" "}
            — values &amp; resources: a practical yes, with conditions. Check
            what it costs and what supports it.
          </li>
          <li>
            <span style={{ color: SUIT_COLOR.clubs }}>{SUIT_GLYPH.clubs} Clubs</span>{" "}
            — mind &amp; communication: a not-yet. The question wants more
            information or a franker conversation before it deserves a verdict.
          </li>
          <li>
            <span style={{ color: SUIT_COLOR.spades }}>{SUIT_GLYPH.spades} Spades</span>{" "}
            — work, will &amp; transformation: a no as things stand — or a yes
            priced in real work and change.
          </li>
        </ul>
        <p className="prose-reading mt-3 text-mist">
          Rank matters too. Both Aces carry {rankTheme("A")} — but the{" "}
          <Link href={`/birth-card/${aceHearts.slug}`} className="text-gold underline underline-offset-4">
            {aceHearts.label}
          </Link>{" "}
          opens {aceHearts.suitDomain.toLowerCase()} while the{" "}
          <Link href={`/birth-card/${aceSpades.slug}`} className="text-gold underline underline-offset-4">
            {aceSpades.label}
          </Link>{" "}
          initiates {aceSpades.suitDomain.toLowerCase()}. Same move, different
          arena — which is why a &ldquo;yes&rdquo; card is worth reading past
          its color. All 52 combinations live in the{" "}
          <Link href="/birth-card" className="text-gold underline underline-offset-4">
            card meanings library
          </Link>
          .
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">What can&rsquo;t a yes-or-no draw tell you?</h2>
        <p className="prose-reading text-mist">
          Whether to take the job. Whether they will call. Whether it works
          out. A shuffled draw is structured chance, and treating it as a
          verdict is a coin flip in better costume. This site&rsquo;s claim
          boundary applies here at full strength: cards are pattern language
          for people, relationships, and timing — a mirror for noticing
          patterns, not a forecast, and never medical, legal, or financial
          advice. The honest use of a yes-or-no draw is the moment after the
          card turns: notice whether you felt relieved or disappointed. That
          reaction is real information about what you already want. If the
          draw clarifies nothing real, discard it.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">When does one real question beat a coin flip?</h2>
        <p className="prose-reading text-mist">
          When the question behind your yes-or-no is actually about a person, a
          relationship, or a stretch of time — most are — the deck has better
          tools than red and black. The deterministic side needs no draw at
          all: your birthday maps to one fixed card through the{" "}
          <Link href="/birth-card-calculator" className="text-gold underline underline-offset-4">
            birth card calculator
          </Link>
          , and that card&rsquo;s pattern usually says more about the decision
          than a coin-colored verdict. And when you want the question talked
          through rather than flipped on, the{" "}
          <Link href={READINGS_PATH} className="text-gold underline underline-offset-4">
            AI voice reader
          </Link>{" "}
          works from your real birth date and your real question — call{" "}
          <a href={READER_PHONE_TEL} className="text-gold underline underline-offset-4">
            {READER_PHONE_DISPLAY}
          </a>{" "}
          and it reads your first card free before anything costs a dollar.
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
        <p className="font-serif text-base text-bone">Ask it out loud instead</p>
        <p className="mt-1 text-sm text-faint">
          A coin flip can&rsquo;t answer a follow-up question. The AI reader
          can — first card free, on the spot.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <a href={READER_PHONE_TEL} className="inline-block rounded-full bg-foil px-5 py-2 font-serif text-sm text-ink">
            Call {READER_PHONE_DISPLAY} →
          </a>
          <Link href="/birth-card-calculator" className="text-sm font-bold text-gold underline underline-offset-4">
            Or find your card free
          </Link>
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
        <Link href="/what-is-cardology" className="text-gold underline underline-offset-4">What is Cardology? →</Link>
      </p>
    </SeoShell>
  );
}
