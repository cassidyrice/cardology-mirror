import type { Metadata } from "next";
import Link from "next/link";
import { FreeCourseCta } from "@/components/free-course/FreeCourseCta";
import { SeoShell } from "@/components/seo/SeoShell";
import { ReadingBridge } from "@/components/seo/ReadingBridge";
import { SITE_NAME } from "@/lib/site";

const TITLE = "Destiny Cards & Love Cards Explained";
const DESCRIPTION =
  "Destiny Cards, Love Cards, and Science of the Cards sit in the same playing-card birth-card family as Cardology. Find your card free, or get a $29 Blueprint.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/destiny-cards" },
  openGraph: {
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    url: "/destiny-cards",
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Card Blueprints" }],
  },
};

const nameRows = [
  ["Destiny Cards / Cards of Your Destiny", "Birthday-to-playing-card work popularized in Robert Lee Camp’s books"],
  ["Love Cards", "Camp’s relationship book — and the phrase people use for birth-card compatibility"],
  ["Science of the Cards", "Treating the deck as a calendar-linked system, not a shuffle"],
  ["Cardology", "Card Blueprints’ name for the same family: birth card, ruling layer, timing, two-person maps"],
] as const;

const claimRows = [
  ["Month + day resolve to one lifelong birth card", "Guaranteed events on a date"],
  ["Same birthday → same card, every time", "Medical, legal, or financial advice"],
  ["Ruling card colors expression", "That Card Blueprints invented the tradition"],
  ["Timing names focus and pressure", "Fate locked in"],
] as const;

const langRows = [
  ["Core card", "Birth Card / Destiny Card", "Birth card — calculator"],
  ["Expression", "Planetary Ruling Card (PRC)", "Ruling card — birth vs ruling"],
  ["Relationship", "Love Cards / connections", "Compatibility calculator"],
  ["Year / chapter", "Yearly spreads, period cards", "Current chapter in the Blueprint"],
  ["System name", "Science of the Cards, Destiny Cards", "Cardology"],
  ["Paid deepen", "Books, software, readings", "Instant written Blueprint — $29"],
] as const;

const tarotRows = [
  ["Deck", "52 playing cards", "78-card tarot (usually Major Arcana pairs)"],
  ["Method", "Birthday → fixed playing card", "Numerology-style reduction"],
  ["Shuffle?", "Not for the birth significator", "Usually yes for spreads"],
  ["Best for", "Birthday identity, chapters, two-date maps", "Archetypal narrative, open questions"],
] as const;

const faqs = [
  {
    q: "What are Destiny Cards?",
    a: "A common name for the playing-card birth-card tradition: your birthday maps to one card in a 52-card deck, often with a ruling card and timing layers. Card Blueprints practices the same family as Cardology.",
  },
  {
    q: "Are Destiny Cards the same as Cardology?",
    a: "Same family, different labels and products. Destiny Cards, Love Cards, and Science of the Cards are widely associated with Robert Lee Camp’s books. Cardology is what Card Blueprints calls its deterministic birth-card work, free calculators, and written Blueprint. Chart footnotes can differ by teacher — compare methods when results disagree.",
  },
  {
    q: "What does Love Cards mean?",
    a: "Camp’s relationship-focused book, and the search phrase for birth-card compatibility. Here that maps to the free compatibility calculator.",
  },
  {
    q: "What is the Science of the Cards?",
    a: "Treating the playing-card deck as a calendar-linked, calculable system (birthdays in, significators out) rather than a shuffled draw. Cardology shares that framing and does not promise fate.",
  },
  {
    q: "How do I find my destiny card?",
    a: "Enter your birthday in the free birth card calculator. Same date always returns the same birth card.",
  },
  {
    q: "Are Destiny Cards the same as tarot?",
    a: "No. Destiny Cards and Cardology use 52 playing cards locked to the birthday. Tarot uses 78 cards and usually shuffles; tarot birth cards are typically Major Arcana pairs from another formula.",
  },
  {
    q: "Can this show relationship compatibility?",
    a: "Yes, as a two-birthday pattern map — not a decision about whether a relationship should continue. Use the compatibility calculator, then check the language against real behavior.",
  },
];

export default function DestinyCardsPage() {
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
    mainEntityOfPage: "https://cardblueprints.com/destiny-cards",
  };

  return (
    <SeoShell
      crumb={[
        { label: "Home", href: "/" },
        { label: "What is Cardology?", href: "/what-is-cardology" },
        { label: "Destiny Cards", href: "/destiny-cards" },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(article) }} />

      <h1 className="display mb-3 text-3xl text-bone">Destiny Cards, Love Cards &amp; Cardology</h1>
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5" data-ai-summary>
        <p className="eyebrow mb-2 text-gold">Direct answer</p>
        <p className="prose-reading text-mist">
          Destiny Cards, Love Cards, and the Science of the Cards are names for the same broad
          tradition: a birthday mapped to one fixed card in a 52-card deck. Card Blueprints calls
          that practice <strong>Cardology</strong> — calculation first, interpretation second. Same
          birthday, same birth card. Reflection, not a shuffled fortune.
        </p>
      </div>
      <p className="mb-6 text-xs text-faint">
        By Cassidy Rice · Updated August 12, 2026 ·{" "}
        <Link href="/editorial-policy" className="text-gold underline underline-offset-4">
          Editorial policy
        </Link>
      </p>

      <div className="mb-8 flex flex-wrap gap-2">
        <Link href="/birth-card-calculator" className="inline-block rounded-full bg-foil px-5 py-2 font-serif text-sm text-ink">
          Find your birth card free →
        </Link>
        <Link href="/birth-card-compatibility-calculator" className="inline-block rounded-full border border-gold/30 px-5 py-2 font-serif text-sm text-gold">
          Compare two birthdays →
        </Link>
        <Link href="/checkout/personal-card-blueprint" className="inline-block rounded-full border border-gold/30 px-5 py-2 font-serif text-sm text-gold">
          Personal Card Blueprint — $29 →
        </Link>
      </div>

      <section className="mt-4">
        <h2 className="eyebrow mb-3 text-gold">Same family, different names</h2>
        <p className="prose-reading mb-4 text-mist">
          If you searched <em>Destiny Cards</em>, <em>Love Cards</em>, <em>Science of the Cards</em>, or{" "}
          <em>Cards of Your Destiny</em>, you are already in the playing-card birth-card family — not
          tarot Major Arcana math.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] border-collapse text-left text-sm text-mist">
            <thead>
              <tr className="border-b border-white/15 text-bone">
                <th className="py-2 pr-3 font-serif text-base">Name people search</th>
                <th className="py-2 font-serif text-base">What it usually means</th>
              </tr>
            </thead>
            <tbody>
              {nameRows.map(([name, meaning]) => (
                <tr key={name} className="border-b border-white/10 align-top">
                  <td className="py-3 pr-3 font-semibold text-bone">{name}</td>
                  <td className="py-3">{meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="prose-reading mt-4 text-mist">
          Card Blueprints did not invent the deck-to-calendar idea. That lineage runs through Olney
          Richmond’s <em>The Mystic Test Book</em> (1893), Florence Campbell and Edith Randall, and
          contemporary teachers such as Camp. The books are documentation. The deck is the system.
          What we own here is the published method, the free tools, and the written{" "}
          <strong>Personal Card Blueprint</strong>.
        </p>
        <p className="prose-reading mt-3 text-mist">
          Full definition:{" "}
          <Link href="/what-is-cardology" className="text-gold underline underline-offset-4">
            What is Cardology?
          </Link>
          {" · "}
          <Link href="/methodology" className="text-gold underline underline-offset-4">
            Methodology
          </Link>
        </p>
      </section>

      <section className="mt-10">
        <h2 className="eyebrow mb-3 text-gold">What “Destiny Cards” usually includes</h2>
        <ol className="prose-reading list-decimal space-y-1.5 pl-5 text-mist">
          <li>A <strong>birth card</strong> — one of 52 playing cards locked to your birthday</li>
          <li>A <strong>planetary ruling card</strong> — how that birth card tends to express</li>
          <li>Sometimes yearly or period cards — the chapter you are in</li>
          <li>Sometimes two-person maps — attraction, friction, ease</li>
        </ol>
        <p className="prose-reading mt-3 text-mist">
          That is the same job Cardology does on this site. Branding and product differ. The deck
          does not. The math is checkable. The prose is interpretation. We describe tendencies, not
          fate.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="eyebrow mb-3 text-gold">How to find your destiny card</h2>
        <ol className="prose-reading list-decimal space-y-1.5 pl-5 text-mist">
          <li>
            Enter the birthday in the free{" "}
            <Link href="/birth-card-calculator" className="text-gold underline underline-offset-4">
              birth card calculator
            </Link>{" "}
            (year helps the ruling-card layer).
          </li>
          <li>Read the fixed card — suit and rank.</li>
          <li>
            Separate layers: birth card = engine; ruling card = steering. See{" "}
            <Link href="/birth-card-vs-ruling-card" className="text-gold underline underline-offset-4">
              birth card vs ruling card
            </Link>
            .
          </li>
          <li>Test for a week. Keep language that names a behavior you can point to.</li>
          <li>Optional deepen: the written Personal Card Blueprint ($29).</li>
        </ol>
        <p className="prose-reading mt-3 text-mist">
          Example from the public method: January 15 resolves to the{" "}
          <strong>Queen of Diamonds</strong> every time. New here? Start with{" "}
          <Link href="/cardology-for-beginners" className="text-gold underline underline-offset-4">
            Cardology for beginners
          </Link>
          .
        </p>
      </section>

      <section className="mt-10">
        <h2 className="eyebrow mb-3 text-gold">Love Cards and compatibility</h2>
        <p className="prose-reading text-mist">
          “Love Cards” is Camp’s relationship title — and how many people ask:{" "}
          <em>what do our birthdays say about us?</em> On Card Blueprints that maps to the free{" "}
          <Link href="/birth-card-compatibility-calculator" className="text-gold underline underline-offset-4">
            compatibility calculator
          </Link>
          : two dates in, a plain-language read of suit and rank dynamics you can compare with lived
          experience. It is a map of friction and ease, not a verdict to marry or leave.
        </p>
      </section>

      <section className="mt-10 overflow-x-auto">
        <h2 className="eyebrow mb-3 text-gold">Science of the Cards (what we claim)</h2>
        <table className="w-full min-w-[32rem] border-collapse text-left text-sm text-mist">
          <thead>
            <tr className="border-b border-white/15 text-bone">
              <th className="py-2 pr-3 font-serif text-base">We claim</th>
              <th className="py-2 font-serif text-base">We do not claim</th>
            </tr>
          </thead>
          <tbody>
            {claimRows.map(([yes, no]) => (
              <tr key={yes} className="border-b border-white/10 align-top">
                <td className="py-3 pr-3">{yes}</td>
                <td className="py-3">{no}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="prose-reading mt-3 text-mist">
          If two calculators disagree, open the{" "}
          <Link href="/methodology" className="text-gold underline underline-offset-4">
            methodology
          </Link>
          , re-run the date, and trust the method you can audit.
        </p>
      </section>

      <section className="mt-10 overflow-x-auto">
        <h2 className="eyebrow mb-3 text-gold">Destiny Cards language vs Card Blueprints</h2>
        <table className="w-full min-w-[36rem] border-collapse text-left text-sm text-mist">
          <thead>
            <tr className="border-b border-white/15 text-bone">
              <th className="py-2 pr-3 font-serif text-base">Idea</th>
              <th className="py-2 pr-3 font-serif text-base">Destiny / Love Cards</th>
              <th className="py-2 font-serif text-base">On Card Blueprints</th>
            </tr>
          </thead>
          <tbody>
            {langRows.map(([idea, dest, cb]) => (
              <tr key={idea} className="border-b border-white/10 align-top">
                <td className="py-3 pr-3 font-semibold text-bone">{idea}</td>
                <td className="py-3 pr-3">{dest}</td>
                <td className="py-3">{cb}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="prose-reading mt-3 text-mist">
          Camp’s books remain a major doorway into this family. Card Blueprints is Cassidy Rice’s
          Cardology practice: free checkable tools, a published method, and one written report.
          Related tradition. Distinct product.
        </p>
      </section>

      <section className="mt-10 overflow-x-auto">
        <h2 className="eyebrow mb-3 text-gold">Destiny Cards vs tarot</h2>
        <table className="w-full min-w-[36rem] border-collapse text-left text-sm text-mist">
          <thead>
            <tr className="border-b border-white/15 text-bone">
              <th className="py-2 pr-3 font-serif text-base"> </th>
              <th className="py-2 pr-3 font-serif text-base">Destiny Cards / Cardology</th>
              <th className="py-2 font-serif text-base">Tarot birth cards</th>
            </tr>
          </thead>
          <tbody>
            {tarotRows.map(([dim, a, b]) => (
              <tr key={dim} className="border-b border-white/10 align-top">
                <td className="py-3 pr-3 font-semibold text-bone">{dim}</td>
                <td className="py-3 pr-3">{a}</td>
                <td className="py-3">{b}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="prose-reading mt-3 text-mist">
          Full side-by-side:{" "}
          <Link href="/cardology-vs-tarot" className="text-gold underline underline-offset-4">
            Cardology vs tarot
          </Link>
        </p>
      </section>

      <section className="mt-10" id="personal-card-blueprint">
        <h2 className="eyebrow mb-3 text-gold">Personal Card Blueprint</h2>
        <p className="prose-reading text-mist">
          When free tools are not enough, the <strong>Personal Card Blueprint</strong> puts the
          pattern in one place: birth card, ruling layer, current chapter, and reflection prompts.{" "}
          <strong>$29 · instant after checkout · no subscription.</strong> Same engine as the free
          calculator; interpretation is labeled as interpretation.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/checkout/personal-card-blueprint" className="inline-block rounded-full bg-foil px-5 py-2 font-serif text-sm text-ink">
            Get My Blueprint — $29 →
          </Link>
          <Link href="/products/personal-card-blueprint" className="inline-block rounded-full border border-gold/30 px-5 py-2 font-serif text-sm text-gold">
            Preview the product page / sample →
          </Link>
        </div>
        <p className="prose-reading mt-3 text-sm text-mist">
          Use the free tools first. Buy only if the system keeps matching real life.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="eyebrow mb-4 text-gold">FAQ</h2>
        <div className="space-y-4">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h3 className="font-serif text-lg text-bone">{f.q}</h3>
              <p className="prose-reading mt-2 text-sm text-mist">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="card-surface mt-10 rounded-2xl border border-gold/25 p-5">
        <p className="font-serif text-base text-bone">Start with the free tools</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/birth-card-calculator" className="inline-block rounded-full bg-foil px-5 py-2 font-serif text-sm text-ink">
            Free birth card calculator →
          </Link>
          <Link href="/checkout/personal-card-blueprint" className="inline-block rounded-full border border-gold/30 px-5 py-2 font-serif text-sm text-gold">
            Personal Blueprint — $29 →
          </Link>
        </div>
      </div>

      <FreeCourseCta source="destiny-cards" className="mt-10" />
      <ReadingBridge variant="general" className="mt-8" />

      <p className="mt-8 text-sm text-mist">
        Related:{" "}
        <Link href="/what-is-cardology" className="text-gold underline underline-offset-4">
          What is Cardology?
        </Link>
        {" · "}
        <Link href="/cardology-for-beginners" className="text-gold underline underline-offset-4">
          Cardology for beginners
        </Link>
        {" · "}
        <Link href="/cardology-vs-tarot" className="text-gold underline underline-offset-4">
          Cardology vs tarot
        </Link>
      </p>
    </SeoShell>
  );
}
