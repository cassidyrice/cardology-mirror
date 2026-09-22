import type { Metadata } from "next";
import Link from "next/link";

import { FreeCourseCta } from "@/components/free-course/FreeCourseCta";
import { SeoHeroFan } from "@/components/seo/SeoHeroFan";
import { SeoShell } from "@/components/seo/SeoShell";
import { CARDOLOGY_TIMELINE } from "@/lib/cardology-timeline";
import { BirthCardCalculator } from "@/components/seo/BirthCardCalculator";
import { DeckMatrix } from "@/components/cards/DeckMatrix";
import {
  BIRTHDAY_DIRECTORY_PATH,
  COMPATIBILITY_DIRECTORY_PATH,
  SITE_NAME,
} from "@/lib/site";
import { ONE_QUESTION_TURNAROUND } from "@/lib/deep-dive";
import { PAGE_UPDATED_DATES } from "@/lib/page-dates";
import { updatedLabel } from "@/lib/page-updated";

const UPDATED = PAGE_UPDATED_DATES["/what-is-cardology"];

const TITLE = "What Is Cardology? Birthday → One Playing Card";
const DESCRIPTION =
  "Cardology maps your birthday to one card in a 52-card deck — same date, same card. Not cardiology, not tarot. Free calculator + sourced history.";
const OG_IMAGE = { url: "/og/what-is-cardology.png", width: 1200, height: 630, alt: "What is Cardology? Three playing cards fanned on paper" };

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/what-is-cardology" },
  openGraph: {
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    url: "/what-is-cardology",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

const faqs = [
  {
    q: "What is Cardology?",
    a: "Cardology is a deterministic system that maps a birthday to one card in a standard 52-card playing deck and uses that card as pattern language for personality, relationships, timing, and recurring dynamics. Same birthday always yields the same card.",
  },
  {
    q: "What is the meaning of cardology?",
    a: "Cardology means reading a standard 52-card playing deck as a calendar: 52 cards for 52 weeks, four suits for four seasons, 13 ranks for the 13 weeks in each season, and 12 court cards for 12 months. Your birthday lands on one of those cards, and that card is read as pattern language for personality, relationships, and timing.",
  },
  {
    q: "What is my cardology card?",
    a: "Your cardology card is the single playing card fixed to your month and day — no birth time needed, unlike an astrology chart. Enter your birthday in the free calculator on this page to see it, along with your planetary ruling card.",
  },
  {
    q: "How is cartomancy different from tarot?",
    a: "Cartomancy reads a 52-card playing deck; tarot reads a 78-card deck with 22 Major Arcana that playing cards do not have. Cardology is narrower than either: it is not a shuffled draw at all — your birthday fixes one card for life, and the same birthday always returns the same card.",
  },
  {
    q: "Is Cardology the same as cardiology?",
    a: "No. Cardiology is heart medicine. Cardology is a birthday-to-playing-card map (52-card deck, not tarot). Same birthday always yields the same card. Free lookup: the birth card calculator on this site.",
  },
  {
    q: "How does Cardology work?",
    a: "Month and day feed a fixed formula that resolves to one of 52 cards, with December 31 as the Joker boundary. February 29 maps normally to the 9 of Clubs. From there you read suit (life domain), rank (movement), ruling card (expression style), and optional timing or compatibility layers.",
  },
  {
    q: "What is my birth card in Cardology?",
    a: "Your Cardology birth card is the playing card locked to your birthday. Use the free calculator on this page — enter month, day, and year — to see the birth card and planetary ruling card instantly.",
  },
  {
    q: "What is a birth card?",
    a: "A birth card is the one playing card assigned to a birthday. In Cardology that assignment is fixed: same date, same card. It is not a tarot birth-card pair and not a government birth-registration card. Full meanings live on the 52 birth-card index.",
  },
  {
    q: "Can I get a free Cardology reading?",
    a: "Yes. Enter a birthday in the free calculator on this page. It returns the fixed birth card and planetary ruling card, then links to the full card meaning for personality, love, money, advice, shadow, and birth dates. No email or random card draw is required.",
  },
  {
    q: "What are the benefits of Cardology?",
    a: "It gives a checkable vocabulary for default patterns, relationship friction and attraction, and the “chapter” you are in. Because the math is fixed, two people can verify the same birthday produces the same card. It is for self-awareness and entertainment, not medical, legal, or fate claims.",
  },
  {
    q: "Is Cardology the same as astrology?",
    a: "Related but different. Astrology reads planetary positions at birth. Cardology maps birthday to a playing card through deck-and-calendar structure. No chart drawing and nothing random.",
  },
  {
    q: "How is Cardology different from tarot?",
    a: "Tarot uses 78 cards including Major Arcana and is often shuffled for a reading. Cardology uses 52 playing cards and locks the birth card to the birthday. Spreads can still be shuffled in cartomancy; birth-card Cardology does not need a shuffle.",
  },
  {
    q: "Does Cardology predict the future?",
    a: "No. Timing language describes pressure, focus, and chapter themes — not guaranteed events. The stronger use is recognizing patterns you can test in real life.",
  },
  {
    q: "Is Cardology accurate?",
    a: "The mapping is exact: the same birthday always produces the same card, and anyone can verify the calculation. The interpretations are pattern language for self-reflection, not empirically validated prediction. Treat a card as a precise mirror to test against real behavior, not as proof about your future.",
  },
  {
    q: "What are Cardology card meanings?",
    a: "Each of the 52 playing cards carries a meaning built from its suit (life domain: hearts, diamonds, clubs, spades) and rank (the movement inside that domain). Card Blueprints publishes a full meaning page for every card, indexed in the card meanings section above.",
  },
  {
    q: "Where does Cardology come from?",
    a: "The 52-card solar calendar was first set out in full in Olney H. Richmond’s The Mystic Test Book (Chicago, 1893, Library of Congress BF1878 .R5). Edith Randall and Florence Campbell’s Sacred Symbols of the Ancients (1947) published the birthday chart most sites still use; Arne Lein (1978) and Robert Lee Camp (1992 onward) carried it into modern print. The deck-as-calendar arithmetic itself was in print by 1762. The full dated timeline with sources is on this page.",
  },
];

const toc = [
  { id: "definition", label: "Definition" },
  { id: "find-your-card", label: "Find your card" },
  { id: "free-reading", label: "Free reading" },
  { id: "how-it-works", label: "How it works" },
  { id: "benefits", label: "Benefits" },
  { id: "suits", label: "Four suits" },
  { id: "card-meanings", label: "Card meanings" },
  { id: "layers", label: "Birth vs ruling" },
  { id: "lineage", label: "Lineage" },
  { id: "not", label: "What it is not" },
  { id: "faq", label: "FAQ" },
];

export default function WhatIsCardology() {
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: TITLE,
    description: DESCRIPTION,
    author: { "@type": "Person", name: "Cassidy Rice" },
    publisher: { "@type": "Organization", name: SITE_NAME },
    dateModified: UPDATED,
    mainEntityOfPage: "https://cardblueprints.com/what-is-cardology",
  };

  return (
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "What is Cardology?", href: "/what-is-cardology" }]}>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(article) }} />

      <SeoHeroFan className="mb-5" />
      <h1 className="display mb-3 text-3xl text-brand-ink">What Is Cardology? Find Your Birth Card from Your Birthday</h1>
      <div className="mb-4 rounded-2xl border border-white/10 bg-brand-ivory/70 p-5" data-ai-summary id="definition">
        <p className="eyebrow mb-2 !text-brand-bronze">Direct answer</p>
        <p className="prose-reading text-brand-ink-soft">
          Cardology is a birthday-to-playing-card system: your month and day map to
          one card in a standard 52-card deck (not tarot). That card is pattern
          language for personality, compatibility, and timing. Same birthday, same
          card — every time. Not cardiology, and not a fate prediction.
        </p>
      </div>
      <p className="mb-2 text-sm text-brand-ink-soft">
        Free first: reveal your birth card below. Optional next: the{" "}
        <Link href="/products/one-question-reading" className="text-brand-oxblood underline underline-offset-4">
          $13 One Question Reading
        </Link>
        {" "}
        — one decision, read from your card and your year, written within {ONE_QUESTION_TURNAROUND}.
      </p>
      <p className="mb-6">
        <Link href="#find-your-card" className="accent-button inline-block">
          Reveal my birth card — free →
        </Link>
      </p>

      <p className="mb-2 text-xs text-brand-ink-soft">
        By Cassidy Rice · Updated {updatedLabel(UPDATED)} ·{" "}
        <Link href="/editorial-policy" className="text-brand-oxblood underline underline-offset-4">
          Editorial policy
        </Link>
      </p>

      <section className="mt-8" id="find-your-card">
        <h2 className="eyebrow mb-2 !text-brand-bronze">What is my birth card in Cardology?</h2>
        <p className="prose-reading mb-4 text-brand-ink-soft">
          Enter any birthday below. The free calculator returns the playing-card birth
          card and ruling card for the Cardology system.
        </p>
        <BirthCardCalculator />
        <p className="mt-4 text-sm">
          <Link href="/birth-card-calculator" className="text-brand-oxblood underline underline-offset-4">
            Prefer the dedicated calculator page →
          </Link>
        </p>
      </section>

      <section className="mt-10" id="free-reading">
        <h2 className="eyebrow mb-2 !text-brand-bronze">Your free Cardology reading</h2>
        <p className="prose-reading text-brand-ink-soft">
          The result above is a free Cardology reading, not only a calculator answer.
          Open the returned birth card to read its personality pattern, love and
          relationship style, money and work themes, advice, shadow, and exact birth
          dates. The planetary ruling card adds a second layer for how the core pattern
          expresses. Nothing is randomly drawn, and no email is required.
        </p>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          For the complete deck, browse{" "}
          <Link href="/birth-card" className="text-brand-oxblood underline underline-offset-4">
            all 52 Cardology card meanings
          </Link>
          . Optional next step: the{" "}
          <Link href="/products/one-question-reading" className="text-brand-oxblood underline underline-offset-4">
            $13 One Question Reading
          </Link>{" "}
          (your card, this year's cards, and the card you owe, read against the one question you bring).
        </p>
        <div className="card-surface mt-5 rounded-2xl border border-gold/25 p-5">
          <p className="font-serif text-base text-brand-ink">After your free card</p>
          <p className="mt-2 text-sm leading-relaxed text-brand-ink-soft">
            The One Question Reading is $13 once: one question, read from your card and
            the year you are in, written for you within {ONE_QUESTION_TURNAROUND}. No subscription.
          </p>
          <Link
            href="/products/one-question-reading"
            className="accent-button mt-4"
          >
            Ask one question — $13
          </Link>
        </div>
      </section>

      <nav aria-label="On this page" className="mb-8 mt-10 rounded-2xl border border-white/10 p-4">
        <p className="eyebrow mb-3 !text-brand-bronze">On this page</p>
        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-brand-ink-soft">
          {toc.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`} className="text-brand-oxblood underline underline-offset-4">
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <p className="prose-reading mb-6 text-brand-ink-soft">
        Cardology maps your birthday to a single playing card — your{" "}
        <strong>birth card</strong> — and uses the 52-card deck as a language for
        personality, timing, and relationships. The part that separates it from a
        horoscope app or a shuffled tarot draw: it is <strong>deterministic</strong>.
        A fixed formula, not a mood ring. If you want a guided path, read{" "}
        <Link href="/cardology-for-beginners" className="text-brand-oxblood underline underline-offset-4">
          Cardology for beginners
        </Link>
        . For the short definition of <strong>what is a birth card</strong>, see{" "}
        <Link href="/blog/pillar/birth-card-meanings" className="text-brand-oxblood underline underline-offset-4">
          birth card meanings
        </Link>
        .
      </p>

      <section className="mt-8" id="how-it-works">
        <h2 className="eyebrow mb-2 !text-brand-bronze">How does Cardology work?</h2>
        <p className="prose-reading text-brand-ink-soft">
          A standard deck has 52 cards; the calendar has 52 weeks. Cardology links
          the two by a fixed rule. December 31 is the Joker boundary, while the leap
          day, February 29, maps normally to the 9 of Clubs. Your birth card is the
          lifelong significator. Suit names the life domain; rank names the movement inside
          that domain. Optional layers add a planetary ruling card, yearly periods,
          daily cards, and two-person compatibility.
        </p>
        <ul className="prose-reading mt-3 space-y-1 text-brand-ink-soft" data-ai-summary>
          <li><strong>52 cards</strong> — the 52 weeks of the year.</li>
          <li><strong>4 suits</strong> — the four seasons.</li>
          <li><strong>13 ranks</strong> — the 13 weeks in each season.</li>
          <li><strong>12 court cards</strong> — the 12 months.</li>
          <li><strong>364 + the Joker</strong> — 13 × 28 days, plus the leftover day of a 365-day year.</li>
        </ul>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          Because the map keys on month and day alone, <strong>no birth time is
          needed</strong> — the part of an astrology chart most people cannot supply.
          Longer layouts built on the same deck — the Life Spread, and the yearly
          spread published as the Book of Destiny — extend the reading into cycles.
        </p>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          Full calculation detail — including a worked birthday example — is on the{" "}
          <Link href="/methodology" className="text-brand-oxblood underline underline-offset-4">
            methodology page
          </Link>
          . The deck-to-year mapping behind it is laid out in the{" "}
          <Link href="/52-card-astrology-explained#calendar" className="text-brand-oxblood underline underline-offset-4">
            Cardology calendar
          </Link>
          .
        </p>
      </section>

      <section className="mt-8" id="benefits">
        <h2 className="eyebrow mb-2 !text-brand-bronze">What are the benefits of Cardology?</h2>
        <ul className="prose-reading space-y-2 text-brand-ink-soft">
          <li>
            <strong>Checkable math.</strong> Two people can verify the same birthday
            produces the same card — rare among personality systems.
          </li>
          <li>
            <strong>Shared vocabulary.</strong> Suits and ranks give precise language
            for friction, attraction, overreach, and gift without blaming character.
          </li>
          <li>
            <strong>Relationship maps.</strong> Comparing two birth cards surfaces
            dynamics you can test against real partnerships and teams.
          </li>
          <li>
            <strong>Timing as chapter, not prophecy.</strong> Period and daily cards
            describe focus and pressure — useful for reflection, not event guarantees.
          </li>
        </ul>
      </section>

      <section className="mt-10" id="suits">
        <h2 className="eyebrow mb-2 !text-brand-bronze">The four suits</h2>
        <ul className="prose-reading space-y-1.5 text-brand-ink-soft">
          <li><span className="text-[#8e321f]">♥ Hearts</span> — relationships &amp; emotion</li>
          <li><span className="text-[#8e321f]">♦ Diamonds</span> — values &amp; resources</li>
          <li><span className="text-[#14110d]">♣ Clubs</span> — mind &amp; communication</li>
          <li><span className="text-[#14110d]">♠ Spades</span> — work, will &amp; transformation</li>
        </ul>
      </section>

      <section className="mt-10" id="card-meanings">
        <h2 className="eyebrow mb-2 !text-brand-bronze">Cardology card meanings: all 52 cards</h2>
        <p className="prose-reading mb-5 text-brand-ink-soft">
          Every card in the deck has its own Cardology card meaning page: the drawn-card
          reading, the birth-card personality, love, money, shadow, and the exact birth
          dates that carry it. Pick a card to open its full meaning.
        </p>
        <DeckMatrix />
      </section>

      <section className="mt-8" id="layers">
        <h2 className="eyebrow mb-2 !text-brand-bronze">Two layers: birth card and ruling card</h2>
        <p className="prose-reading text-brand-ink-soft">
          Most people have two key cards — the birth card and a planetary ruling card
          that colors how it expresses. We break down the difference in{" "}
          <Link href="/birth-card-vs-ruling-card" className="text-brand-oxblood underline underline-offset-4">
            birth card vs ruling card
          </Link>
          , and the second layer gets its own explainer at{" "}
          <Link href="/planetary-ruling-card" className="text-brand-oxblood underline underline-offset-4">
            planetary ruling card
          </Link>
          .
        </p>
      </section>

      <section className="mt-8" id="which-layer">
        <h2 className="eyebrow mb-2 !text-brand-bronze">Which layer am I reading?</h2>
        <p className="prose-reading text-brand-ink-soft">
          Before you look up a meaning, check what the card actually is. A birth
          card is lifelong. A ruling card colors how it expresses. A card in a
          yearly period only describes a 52-day stretch. Same card, different
          job — so keep the label attached when you look it up.
        </p>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          Where the cards sit and how they move is the board:{" "}
          <Link href="/playing-card-spreads" className="text-brand-oxblood underline underline-offset-4">
            playing card spreads
          </Link>
          . To see one card read through each of the seven period filters, run it
          through the{" "}
          <Link href="/52-day-period-meaning-tool" className="text-brand-oxblood underline underline-offset-4">
            52-day period meaning tool
          </Link>
          .
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 !text-brand-bronze">Why it works best on real people</h2>
        <p className="prose-reading text-brand-ink-soft">
          The cards become useful when you apply them to actual lives: your own
          patterns, the people closest to you, public figures, family roles,
          attraction, friction, work chemistry, and the places a strength tips into
          excess. Nothing here is fixed fate; it is a vocabulary for seeing behavior
          with more precision.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 !text-brand-bronze">How the calculation actually works</h2>
        <p className="prose-reading text-brand-ink-soft">
          There is no chart to draw and no judgment call to make. Every card carries a
          fixed numeric value based on its position. A short equation on birth month
          and day resolves to exactly one value — that value is your card. Run it a
          thousand times and you get the same answer a thousand times.
        </p>
      </section>

      <section className="mt-8" id="lineage">
        <h2 className="eyebrow mb-2 !text-brand-bronze">Where it comes from: a dated, sourced history</h2>
        <p className="prose-reading text-brand-ink-soft">
          Most Cardology sites tell the origin story without a single citation. Here is what the
          library records and the surviving books actually show. Every entry links to the source
          it rests on; anything that rests only on one author&rsquo;s word is marked as such.
        </p>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          Book by book, with publisher and catalogue record:{" "}
          <Link href="/cardology-books" className="text-brand-oxblood underline underline-offset-4">
            the Cardology books &amp; decks directory
          </Link>
          .
        </p>
        <ol className="mt-4 space-y-3 border-l border-white/15 pl-4">
          {CARDOLOGY_TIMELINE.map((t) => (
            <li key={t.year + t.sourceLabel} className="relative pl-2">
              <span className="absolute -left-[1.35rem] top-1.5 h-2 w-2 rounded-full bg-gold" aria-hidden="true" />
              <p className="text-sm text-brand-ink-soft">
                <strong className="font-serif text-base text-brand-ink">{t.year}</strong>
                {" \u00b7 "}
                {t.what}{" "}
                <a href={t.source} rel="noopener" className="text-brand-oxblood underline underline-offset-4">
                  [{t.sourceLabel}]
                </a>
              </p>
            </li>
          ))}
        </ol>
        <h3 className="mt-6 font-serif text-xl text-brand-ink">Claims you will read elsewhere that the sources do not support</h3>
        <ul className="prose-reading mt-2 space-y-2 text-sm text-brand-ink-soft">
          <li>
            <strong>Atlantis, Egypt, and a 20,000-year-old Order of the Magi.</strong> Every version of
            this traces to Richmond&rsquo;s own 1892&ndash;93 books, which lean on a speculative book titled
            <em> Atlantis</em>. Richmond himself quotes the <em>Encyclopaedia Britannica</em> that the
            origin of playing cards is disputed. There is no independent evidence.
          </li>
          <li>
            <strong>An unbroken secret order from 1864.</strong> The 1864 Nashville initiation and the
            1889 &ldquo;first modern temple&rdquo; are Richmond&rsquo;s testimony, reprinted from his own
            interviews with a Grand Rapids newspaper. Membership figures repeated online are uncited.
          </li>
          <li>
            <strong>&ldquo;Cardology&rdquo; was coined in 1934.</strong> Asserted by one modern site citing a
            1939 copyright catalog entry for an &ldquo;Astro-Cardology&rdquo; booklet. We could not verify
            it, so we do not repeat it as fact.
          </li>
          <li>
            <strong>The deck-as-calendar was a hidden revelation.</strong> The arithmetic (52 cards, 4 suits,
            13 ranks, 364 spots plus the Joker) was already circulating in print as the
            &ldquo;Perpetual Almanack&rdquo; card story by 1762, more than a century before Richmond.
          </li>
        </ul>
        <h3 className="mt-6 font-serif text-xl text-brand-ink">Cardology, cardiology, cartomancy, tarot</h3>
        <p className="prose-reading mt-2 text-sm text-brand-ink-soft">
          <strong>Cardiology</strong> is the medicine of the heart; the words share four letters and nothing
          else. <strong>Cartomancy</strong> is reading shuffled cards for an answer, which Cardology does not
          do: the card is fixed by your birthday. <strong>Tarot</strong> uses a 78-card deck with a different
          numerology. <strong>Destiny Cards</strong>, <strong>Love Cards</strong>, and <strong>Science of the
          Cards</strong> are book and brand names for this same 52-card birthday system. The word
          &ldquo;Cardology&rdquo; itself is a registered US trademark (Reg. 5703102, 2019) for playing cards and
          merchandise; it does not cover the practice or the word in writing.
        </p>
        <p className="prose-reading mt-3 text-sm text-brand-ink-soft">
          Our position: the books are documentation, the deck is the system. The calculation on this site
          reproduces the 1947 birthday chart exactly and is published on the{" "}
          <Link href="/methodology" className="text-brand-oxblood underline underline-offset-4">methodology page</Link>
          {" "}so you can check it against the primary texts yourself.
        </p>
      </section>

      <section className="mt-8" id="not">
        <h2 className="eyebrow mb-2 !text-brand-bronze">What Cardology is not</h2>
        <p className="prose-reading text-brand-ink-soft">
          It is not a random draw, not medical or financial advice, and not a costume.
          A card cannot tell you what will happen on Tuesday. What it can do is name a
          recurring pattern with enough precision that you start seeing it in behavior.
          Card Blueprints frames the whole practice as self-awareness and entertainment —
          tendencies, not fate. It is also not a separate system from{" "}
          <Link href="/destiny-cards" className="text-brand-oxblood underline underline-offset-4">
            Cards of Destiny
          </Link>
          {" "}— that is the same birthday-to-card map under the name Robert Camp&rsquo;s
          books made popular.
        </p>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          For a side-by-side with tarot language, see{" "}
          <Link href="/cartomancy-vs-tarot" className="text-brand-oxblood underline underline-offset-4">
            cartomancy vs tarot
          </Link>
          . For 52-card astrology framing, see{" "}
          <Link href="/52-card-astrology-explained" className="text-brand-oxblood underline underline-offset-4">
            52-card astrology explained
          </Link>
          .
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 !text-brand-bronze">How people actually use it</h2>
        <p className="prose-reading text-brand-ink-soft">
          Birth card as baseline. Other people&rsquo;s cards for comparison. Compatibility
          between two birthdays. Timing cards for the chapter you are in. When you want
          the pattern written out, start with the{" "}
          <Link href="/products/one-question-reading" className="text-brand-oxblood underline underline-offset-4">
            $13 One Question Reading
          </Link>
          — one question, read from your card, this year's cards, and the card you owe.
        </p>
      </section>

      <section className="mt-10" id="faq">
        <h2 className="eyebrow mb-4 !text-brand-bronze">Cardology FAQ</h2>
        <div className="space-y-4">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-2xl border border-white/10 bg-brand-ivory/70 p-4">
              <h3 className="font-serif text-lg text-brand-ink">{f.q}</h3>
              <p className="prose-reading mt-2 text-sm text-brand-ink-soft">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <FreeCourseCta source="learn" className="mt-10" />

      <div className="card-surface mt-6 rounded-2xl p-5">
        <p className="font-serif text-base text-brand-ink">Keep going</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/products/one-question-reading" className="ink-button">
            $13 One Question Reading →
          </Link>
          <Link href="/birth-card-calculator" className="inline-block rounded-full border border-gold/30 px-5 py-2 font-serif text-sm text-brand-oxblood">
            Calculator page →
          </Link>
          <Link href="/cardology-for-beginners" className="inline-block rounded-full border border-gold/30 px-5 py-2 font-serif text-sm text-brand-oxblood">
            Beginners path →
          </Link>
          <a href={BIRTHDAY_DIRECTORY_PATH} className="inline-block rounded-full border border-gold/30 px-5 py-2 font-serif text-sm text-brand-oxblood">
            Birthdays by date →
          </a>
          <a href={COMPATIBILITY_DIRECTORY_PATH} className="inline-block rounded-full border border-gold/30 px-5 py-2 font-serif text-sm text-brand-oxblood">
            All pairings →
          </a>
        </div>
      </div>
    </SeoShell>
  );
}
