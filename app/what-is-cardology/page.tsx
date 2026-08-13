import type { Metadata } from "next";
import Link from "next/link";

import { FreeCourseCta } from "@/components/free-course/FreeCourseCta";
import { SeoShell } from "@/components/seo/SeoShell";
import { BirthCardCalculator } from "@/components/seo/BirthCardCalculator";
import { ReadingBridge } from "@/components/seo/ReadingBridge";
import {
  BIRTHDAY_DIRECTORY_PATH,
  COMPATIBILITY_DIRECTORY_PATH,
  SITE_NAME,
} from "@/lib/site";

const TITLE = "What Is Cardology? Birthday → One Playing Card (Not Tarot)";
const DESCRIPTION =
  "Cardology maps your birthday to one card in a 52-card deck — not tarot. Plain-English guide, then find your birth card free with the calculator.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/what-is-cardology" },
  openGraph: {
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    url: "/what-is-cardology",
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Card Blueprints" }],
  },
};

const faqs = [
  {
    q: "What is Cardology?",
    a: "Cardology is a deterministic system that maps a birthday to one card in a standard 52-card playing deck and uses that card as pattern language for personality, relationships, timing, and recurring dynamics. Same birthday always yields the same card.",
  },
  {
    q: "How does Cardology work?",
    a: "Month and day feed a fixed formula that resolves to one of 52 cards (with December 31 as the Joker and February 29 outside the cycle). From there you read suit (life domain), rank (movement), ruling card (expression style), and optional timing or compatibility layers.",
  },
  {
    q: "What is my birth card in Cardology?",
    a: "Your Cardology birth card is the playing card locked to your birthday. Use the free Cardology calculator (also called a Cardology birthday or chart calculator) at https://cardblueprints.com/birth-card-calculator — enter month, day, and year — to see the birth card and planetary ruling card instantly.",
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
    q: "Where does Cardology come from?",
    a: "Modern documentation includes Olney Richmond’s The Mystic Test Book (1893), later work by Florence Campbell and Edith Randall, and contemporary teachers such as Robert Lee Camp. The deck-to-calendar structure (52 cards / 52 weeks) is older than any single book.",
  },
];

const toc = [
  { id: "definition", label: "Definition" },
  { id: "how-it-works", label: "How it works" },
  { id: "benefits", label: "Benefits" },
  { id: "find-your-card", label: "Find your card" },
  { id: "suits", label: "Four suits" },
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
    dateModified: "2026-08-12",
    mainEntityOfPage: "https://cardblueprints.com/what-is-cardology",
  };

  return (
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "What is Cardology?", href: "/what-is-cardology" }]}>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(article) }} />

      <h1 className="display mb-3 text-3xl text-bone">What Is Cardology? Playing Cards from Your Birthday</h1>
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5" data-ai-summary id="definition">
        <p className="eyebrow mb-2 text-gold">Direct answer</p>
        <p className="prose-reading text-mist">
          Cardology is a birthday-to-playing-card system: your month and day map to
          one card in a standard 52-card deck (not tarot). That card is pattern
          language for personality, compatibility, and timing. Same birthday, same
          card — every time.
        </p>
      </div>

      <p className="mb-2 text-xs text-faint">
        By Cassidy Rice · Updated August 12, 2026 ·{" "}
        <Link href="/editorial-policy" className="text-gold underline underline-offset-4">
          Editorial policy
        </Link>
      </p>

      <nav aria-label="On this page" className="mb-8 rounded-2xl border border-white/10 p-4">
        <p className="eyebrow mb-3 text-gold">On this page</p>
        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-mist">
          {toc.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`} className="text-gold underline underline-offset-4">
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <p className="prose-reading mb-6 text-mist">
        Cardology maps your birthday to a single playing card — your{" "}
        <strong>birth card</strong> — and uses the 52-card deck as a language for
        personality, timing, and relationships. The part that separates it from a
        horoscope app or a shuffled tarot draw: it is <strong>deterministic</strong>.
        A fixed formula, not a mood ring. If you want a guided path, read{" "}
        <Link href="/cardology-for-beginners" className="text-gold underline underline-offset-4">
          Cardology for beginners
        </Link>
        .
      </p>

      <section className="mt-8" id="how-it-works">
        <h2 className="eyebrow mb-2 text-gold">How does Cardology work?</h2>
        <p className="prose-reading text-mist">
          A standard deck has 52 cards; the calendar has 52 weeks. Cardology links
          the two: 364 of 365 dates map to a card by set rule — December 31 gets the
          Joker; February 29 sits outside the cycle. Your birth card is the lifelong
          significator. Suit names the life domain; rank names the movement inside
          that domain. Optional layers add a planetary ruling card, yearly periods,
          daily cards, and two-person compatibility.
        </p>
        <p className="prose-reading mt-3 text-mist">
          Full calculation detail — including a worked birthday example — is on the{" "}
          <Link href="/methodology" className="text-gold underline underline-offset-4">
            methodology page
          </Link>
          .
        </p>
      </section>

      <section className="mt-8" id="benefits">
        <h2 className="eyebrow mb-2 text-gold">What are the benefits of Cardology?</h2>
        <ul className="prose-reading space-y-2 text-mist">
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

      <section className="mt-10" id="find-your-card">
        <h2 className="eyebrow mb-2 text-gold">What is my birth card in Cardology?</h2>
        <p className="prose-reading mb-4 text-mist">
          Enter any birthday below. The free calculator returns the playing-card birth
          card and ruling card for the Cardology system.
        </p>
        <BirthCardCalculator />
      </section>

      <section className="mt-10" id="suits">
        <h2 className="eyebrow mb-2 text-gold">The four suits</h2>
        <ul className="prose-reading space-y-1.5 text-mist">
          <li><span className="text-[#8e321f]">♥ Hearts</span> — relationships &amp; emotion</li>
          <li><span className="text-[#8e321f]">♦ Diamonds</span> — values &amp; resources</li>
          <li><span className="text-[#14110d]">♣ Clubs</span> — mind &amp; communication</li>
          <li><span className="text-[#14110d]">♠ Spades</span> — work, will &amp; transformation</li>
        </ul>
      </section>

      <section className="mt-8" id="layers">
        <h2 className="eyebrow mb-2 text-gold">Two layers: birth card and ruling card</h2>
        <p className="prose-reading text-mist">
          Most people have two key cards — the birth card and a planetary ruling card
          that colors how it expresses. We break down the difference in{" "}
          <Link href="/birth-card-vs-ruling-card" className="text-gold underline underline-offset-4">
            birth card vs ruling card
          </Link>
          .
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">Why it works best on real people</h2>
        <p className="prose-reading text-mist">
          The cards become useful when you apply them to actual lives: your own
          patterns, the people closest to you, public figures, family roles,
          attraction, friction, work chemistry, and the places a strength tips into
          excess. Nothing here is fixed fate; it is a vocabulary for seeing behavior
          with more precision.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">How the calculation actually works</h2>
        <p className="prose-reading text-mist">
          There is no chart to draw and no judgment call to make. Every card carries a
          fixed numeric value based on its position. A short equation on birth month
          and day resolves to exactly one value — that value is your card. Run it a
          thousand times and you get the same answer a thousand times.
        </p>
      </section>

      <section className="mt-8" id="lineage">
        <h2 className="eyebrow mb-2 text-gold">Where it comes from</h2>
        <p className="prose-reading text-mist">
          Modern documentation includes <em>The Mystic Test Book</em> (Olney Richmond,
          1893), later development by Florence Campbell and Edith Randall (
          <em>Sacred Symbols of the Ancients</em>), and contemporary teachers such as
          Robert Lee Camp. The lineage matters less than the structure: deck-to-calendar
          correspondences existed before those books. The books are documentation. The
          deck is the system.
        </p>
      </section>

      <section className="mt-8" id="not">
        <h2 className="eyebrow mb-2 text-gold">What Cardology is not</h2>
        <p className="prose-reading text-mist">
          It is not a random draw, not medical or financial advice, and not a costume.
          A card cannot tell you what will happen on Tuesday. What it can do is name a
          recurring pattern with enough precision that you start seeing it in behavior.
          Card Blueprints frames the whole practice as self-awareness and entertainment —
          tendencies, not fate.
        </p>
        <p className="prose-reading mt-3 text-mist">
          For a side-by-side with tarot language, see{" "}
          <Link href="/cartomancy-vs-tarot" className="text-gold underline underline-offset-4">
            cartomancy vs tarot
          </Link>
          . For 52-card astrology framing, see{" "}
          <Link href="/52-card-astrology-explained" className="text-gold underline underline-offset-4">
            52-card astrology explained
          </Link>
          .
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">How people actually use it</h2>
        <p className="prose-reading text-mist">
          Birth card as baseline. Other people&rsquo;s cards for comparison. Compatibility
          between two birthdays. Timing cards for the chapter you are in. When you want
          the pattern written out as a full report, the{" "}
          <Link href="/products/personal-card-blueprint" className="text-gold underline underline-offset-4">
            Personal Card Blueprint ($13)
          </Link>{" "}
          is the paid deepen after the free tools.
        </p>
      </section>

      <section className="mt-10" id="faq">
        <h2 className="eyebrow mb-4 text-gold">Cardology FAQ</h2>
        <div className="space-y-4">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h3 className="font-serif text-lg text-bone">{f.q}</h3>
              <p className="prose-reading mt-2 text-sm text-mist">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <FreeCourseCta source="learn" className="mt-10" />
      <ReadingBridge variant="general" className="mt-8" />

      <div className="card-surface mt-6 rounded-2xl p-5">
        <p className="font-serif text-base text-bone">Keep going</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/cardology-for-beginners" className="inline-block rounded-full bg-foil px-5 py-2 font-serif text-sm text-ink">
            Beginners path →
          </Link>
          <Link href="/birth-card-calculator" className="inline-block rounded-full border border-gold/30 px-5 py-2 font-serif text-sm text-gold">
            Calculator page →
          </Link>
          <a href={BIRTHDAY_DIRECTORY_PATH} className="inline-block rounded-full border border-gold/30 px-5 py-2 font-serif text-sm text-gold">
            Birthdays by date →
          </a>
          <a href={COMPATIBILITY_DIRECTORY_PATH} className="inline-block rounded-full border border-gold/30 px-5 py-2 font-serif text-sm text-gold">
            All pairings →
          </a>
        </div>
      </div>
    </SeoShell>
  );
}
