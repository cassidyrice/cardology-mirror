import type { Metadata } from "next";
import Link from "next/link";
import { FreeCourseCta } from "@/components/free-course/FreeCourseCta";
import { BirthCardCalculator } from "@/components/seo/BirthCardCalculator";
import { PlayingCardsBirthdayChart } from "@/components/seo/PlayingCardsBirthdayChart";
import { SeoShell } from "@/components/seo/SeoShell";
import { TableScroll } from "@/components/seo/TableScroll";
import { ONE_QUESTION_TURNAROUND } from "@/lib/deep-dive";
import { SITE_NAME } from "@/lib/site";
import { PAGE_UPDATED_DATES } from "@/lib/page-dates";
import { updatedLabel } from "@/lib/page-updated";

const TITLE = "Cards of Destiny: Free Birth Card Calculator (Destiny Cards)";
const DESCRIPTION =
  "Cards of Destiny — also written Destiny Cards — lock your birthday to one playing card. Free calculator, ruling card, full meaning, and the books the system comes from. Not tarot.";
const UPDATED = PAGE_UPDATED_DATES["/destiny-cards"];

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "cards of destiny",
    "destiny cards",
    "cards of destiny reading",
    "cards of destiny book",
    "cards of destiny compatibility chart",
    "destiny card calculator",
    "cards of destiny calculator",
    "destiny cards chart",
  ],
  alternates: { canonical: "/destiny-cards" },
  openGraph: {
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    url: "/destiny-cards",
    images: [{ url: "/og/destiny-cards.png", width: 1200, height: 630, alt: "Cards of Destiny — three playing cards fanned on paper" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og/destiny-cards.png"],
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
  ["Year / chapter", "Yearly spreads, period cards", "The 90 yearly spreads, published free"],
  ["System name", "Science of the Cards, Destiny Cards", "Cardology"],
  ["Paid deepen", "Books, software, readings", "One Question Reading — $13"],
] as const;

const tarotRows = [
  ["Deck", "52 playing cards", "78-card tarot (usually Major Arcana pairs)"],
  ["Method", "Birthday → fixed playing card", "Numerology-style reduction"],
  ["Shuffle?", "Not for the birth significator", "Usually yes for spreads"],
  ["Best for", "Birthday identity, chapters, two-date maps", "Archetypal narrative, open questions"],
] as const;

const faqs = [
  {
    q: "Can I get a free destiny card reading?",
    a: "Yes. The free destiny card reading on this page is the calculator plus chart: enter a birthday and you get the destiny card (birth card), the planetary ruling card, and a full meaning page — no email required. The paid $13 One Question Reading is a written reading on one decision, not a prerequisite.",
  },
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
  {
    q: "What are Cards of Destiny?",
    a: "Another search name for Destiny Cards: your birthday maps to one playing card in a 52-card deck. Use the calculator on this page.",
  },
  {
    q: "Is Cards of Destiny the same as Destiny Cards?",
    a: "Yes in search. Books and sites mix the labels. Same deck family here — not tarot.",
  },
  {
    q: "Do I need the Robert Lee Camp books to use this?",
    a: "No. The free calculator and published method are enough. The books are one doorway into the family, not a requirement.",
  },
  {
    q: "Is there a Cards of Destiny compatibility chart?",
    a: "Yes — but a chart is the slow way. A compatibility chart lists how each of the 52 cards reads against the others; the free compatibility calculator does the same lookup from two birthdays and shows the positions behind the answer rather than a single score.",
  },
  {
    q: "Is there a Cards of Destiny app?",
    a: "The calculator on this page works in any phone browser with no install and no account — enter a birthday and it returns the card, the ruling card, and the full meaning page.",
  },
  {
    q: "What is a Cards of Destiny reading?",
    a: "A reading built from the card your birthday lands on rather than from a shuffle: the birth card, the ruling card behind it, and the yearly spread that says which 52-day period you are in. Start free with the calculator on this page; the paid One Question Reading answers one specific question from the same cards.",
  },
  {
    q: "What are Robert Camp's Destiny Cards?",
    a: "Robert Lee Camp published The Cards of Your Destiny in 1992 and the trade editions Destiny Cards and Love Cards in 1997, which is how the name reached bookshops. The system he writes about traces back to Olney Richmond's 1893 Mystic Test Book and the 1947 birthday chart in Sacred Symbols of the Ancients — publishers and catalogue records are in the books directory.",
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
    dateModified: UPDATED,
    mainEntityOfPage: "https://cardblueprints.com/destiny-cards",
  };

  const appLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Cards of Destiny Calculator",
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    description: DESCRIPTION,
    url: "https://cardblueprints.com/destiny-cards",
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appLd) }} />

      <p className="eyebrow mb-3 text-brand-bronze">Free lookup · not tarot · not fate</p>
      <h1 className="display mb-3 text-3xl text-brand-ink">Cards of Destiny: Find Your Birth Card (Free Calculator)</h1>
      <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5" data-ai-summary>
        <p className="eyebrow mb-2 text-brand-bronze">Direct answer</p>
        <p className="prose-reading text-brand-ink-soft">
          Cards of Destiny and Destiny Cards are names for a birthday mapped to one
          card in a 52-card deck. Use the free calculator below. Card Blueprints calls the same
          family <strong>Cardology</strong>. Pattern language — not tarot, not fortune-telling.
        </p>
      </div>
      <p className="mb-4 text-sm text-brand-ink-soft">
        Free first: reveal your destiny card on this page. Optional next: the{" "}
        <Link href="/products/one-question-reading" className="text-brand-oxblood underline underline-offset-4">
          $13 One Question Reading
        </Link>
        {" "}— one decision, read from your card and your year, written within {ONE_QUESTION_TURNAROUND}.
      </p>
      <div className="mb-4">
        <BirthCardCalculator />
      </div>
      <div className="card-surface mb-6 rounded-2xl border border-gold/25 p-5">
        <p className="font-serif text-base text-brand-ink">After your free destiny card</p>
        <p className="mt-2 text-sm leading-relaxed text-brand-ink-soft">
          The calculator result already offers the $13 One Question Reading: one
          question, read from your card, this year's cards, and the card you owe.
          Written for you within {ONE_QUESTION_TURNAROUND}. One payment.
        </p>
        <Link
          href="/products/one-question-reading"
          className="mt-4 inline-block rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-ink hover:opacity-90"
        >
          Ask one question — $13
        </Link>
      </div>

      <p className="mb-6 text-xs text-brand-ink-soft">
        By Cassidy Rice · Updated {updatedLabel(UPDATED)} ·{" "}
        <Link href="/editorial-policy" className="text-brand-oxblood underline underline-offset-4">
          Editorial policy
        </Link>
      </p>

      <nav className="mb-8 flex flex-wrap gap-2" aria-label="Destiny Cards sections">
        {[
          ["#destiny-chart", "Chart"],
          ["#names", "Names"],
          ["#vs-cardology", "vs Cardology"],
          ["#vs-tarot", "vs tarot"],
          ["#faq", "FAQ"],
        ].map(([href, label]) => (
          <a key={href} href={href} className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-brand-ink-soft hover:text-brand-ink">
            {label}
          </a>
        ))}
      </nav>

      <section id="destiny-chart" className="mt-4 scroll-mt-10">
        <p className="eyebrow mb-2 text-brand-bronze">Cards of Destiny chart</p>
        <h2 className="font-serif text-3xl text-brand-ink">Birthday → playing card</h2>
        <p className="prose-reading mt-4 text-brand-ink-soft">
          Same map as the calculator. Pick a date, or type one above. Larger copy lives on the{" "}
          <Link href="/birth-card-calculator#cardology-chart" className="text-brand-oxblood underline underline-offset-4">
            Cardology chart
          </Link>
          .
        </p>
        <div className="mt-6">
          <PlayingCardsBirthdayChart />
        </div>
      </section>

      <section id="free-reading" className="mt-10 scroll-mt-10">
        <h2 className="eyebrow mb-3 text-brand-bronze">Free destiny card reading</h2>
        <p className="prose-reading text-brand-ink-soft">
          A destiny card reading starts with one input: a birthday. The calculator above
          returns the destiny card itself, the planetary ruling card, and a link to the
          card&rsquo;s full meaning — personality, love, money, shadow, and every birth date
          that carries it. That is the complete free reading; nothing is gated behind an
          email form.
        </p>

      </section>

      <section id="names" className="mt-10 scroll-mt-10">
        <h2 className="eyebrow mb-3 text-brand-bronze">Same family, different names</h2>
        <p className="prose-reading mb-4 text-brand-ink-soft">
          If you searched <em>Destiny Cards</em>, <em>Love Cards</em>, <em>Science of the Cards</em>, or{" "}
          <em>Cards of Your Destiny</em>, you are already in the playing-card birth-card family — not
          tarot Major Arcana math.
        </p>
        <TableScroll label="Destiny Cards family names">
          <table className="w-full min-w-[32rem] border-collapse text-left text-sm text-brand-ink-soft">
            <caption className="sr-only">Search names for the playing-card birth-card family</caption>
            <thead>
              <tr className="border-b border-white/15 text-brand-ink">
                <th className="py-2 pr-3 font-serif text-base" scope="col">Name people search</th>
                <th className="py-2 font-serif text-base" scope="col">What it usually means</th>
              </tr>
            </thead>
            <tbody>
              {nameRows.map(([name, meaning]) => (
                <tr key={name} className="border-b border-white/10 align-top">
                  <th className="py-3 pr-3 font-semibold text-brand-ink" scope="row">{name}</th>
                  <td className="py-3">{meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
        <p className="prose-reading mt-4 text-brand-ink-soft">
          Card Blueprints did not invent the deck-to-calendar idea. That lineage runs through Olney
          Richmond’s <em>The Mystic Test Book</em> (1893), Florence Campbell and Edith Randall, and
          contemporary teachers such as Camp. The books are documentation. The deck is the system.
          What we own here is the published method, the free tools, and the{" "}
          <strong>One Question Reading</strong>.
        </p>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          Full definition:{" "}
          <Link href="/what-is-cardology" className="text-brand-oxblood underline underline-offset-4">
            What is Cardology?
          </Link>
          {" · "}
          <Link href="/methodology" className="text-brand-oxblood underline underline-offset-4">
            Methodology
          </Link>
        </p>
      </section>

      <section className="mt-10">
        <h2 className="eyebrow mb-3 text-brand-bronze">What “Destiny Cards” usually includes</h2>
        <ol className="prose-reading list-decimal space-y-1.5 pl-5 text-brand-ink-soft">
          <li>A <strong>birth card</strong> — one of 52 playing cards locked to your birthday</li>
          <li>A <strong>planetary ruling card</strong> — how that birth card tends to express</li>
          <li>Sometimes yearly or period cards — the chapter you are in</li>
          <li>Sometimes two-person maps — attraction, friction, ease</li>
        </ol>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          That is the same job Cardology does on this site. Branding and product differ. The deck
          does not. The math is checkable. The prose is interpretation. We describe tendencies, not
          fate.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="eyebrow mb-3 text-brand-bronze">How to find your destiny card</h2>
        <ol className="prose-reading list-decimal space-y-1.5 pl-5 text-brand-ink-soft">
          <li>
            Enter the birthday in the free calculator on this page, or use the dedicated{" "}
            <Link href="/birth-card-calculator" className="text-brand-oxblood underline underline-offset-4">
              birth card calculator
            </Link>{" "}
            (year helps the ruling-card layer).
          </li>
          <li>Read the fixed card — suit and rank.</li>
          <li>
            Separate layers: birth card = engine; ruling card = steering. See{" "}
            <Link href="/birth-card-vs-ruling-card" className="text-brand-oxblood underline underline-offset-4">
              birth card vs ruling card
            </Link>
            .
          </li>
          <li>Test for a week. Keep language that names a behavior you can point to.</li>
          <li>
            Optional deepen: the{" "}
            <Link href="/products/one-question-reading" className="text-brand-oxblood underline underline-offset-4">
              One Question Reading ($13)
            </Link>
            , one question read from your card and your year.
          </li>
        </ol>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          Example from the public method: January 15 resolves to the{" "}
          <strong>Queen of Diamonds</strong> every time. New here? Start with{" "}
          <Link href="/cardology-for-beginners" className="text-brand-oxblood underline underline-offset-4">
            Cardology for beginners
          </Link>
          .
        </p>
      </section>

      <section className="mt-10" id="book">
        <h2 className="eyebrow mb-3 text-brand-bronze">The Cards of Destiny books</h2>
        <p className="prose-reading text-brand-ink-soft">
          Searching the phrase usually turns up books before it turns up a
          calculator, so here is the shelf in order. Robert Lee Camp&rsquo;s{" "}
          <em>The Cards of Your Destiny</em> (Seven Thunders, 1992) carries the
          yearly spread; his <em>Destiny Cards</em> and <em>Love Cards</em>
          (Sourcebooks, 1997) are the trade editions that put the name in
          bookshops. Sharon Jeffers&rsquo; <em>Cards of Destiny</em> (2006) is a
          different author working the same birthday system. All three rest on
          Olney Richmond&rsquo;s <em>Mystic Test Book</em> (1893) and the birthday
          chart in <em>Sacred Symbols of the Ancients</em> (1947).
        </p>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          Every title with its publisher, year, and catalogue record is in the{" "}
          <Link href="/cardology-books" className="text-brand-oxblood underline underline-offset-4">
            books and decks directory
          </Link>
          . You do not need any of them to use the calculator above — the method is
          published on the{" "}
          <Link href="/methodology" className="text-brand-oxblood underline underline-offset-4">
            methodology page
          </Link>
          .
        </p>
      </section>

      <section className="mt-10" id="not-caraval">
        <h2 className="eyebrow mb-3 text-brand-bronze">Looking for the Caraval Deck of Destiny?</h2>
        <p className="prose-reading text-brand-ink-soft">
          Different thing entirely. The Deck of Destiny in Stephanie Garber&rsquo;s
          Caraval and Once Upon a Broken Heart novels is fiction — invented cards
          with invented Fates. The Cards of Destiny on this page are a 52-card
          playing deck mapped to calendar dates, in print since 1893. If you came
          here for the novels, this page will not help.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="eyebrow mb-3 text-brand-bronze">Love Cards and compatibility</h2>
        <p className="prose-reading text-brand-ink-soft">
          “Love Cards” is Camp’s relationship title — and how many people ask:{" "}
          <em>what do our birthdays say about us?</em> On Card Blueprints that maps to the free{" "}
          <Link href="/birth-card-compatibility-calculator" className="text-brand-oxblood underline underline-offset-4">
            compatibility calculator
          </Link>
          : two dates in, a plain-language read of suit and rank dynamics you can compare with lived
          experience. It is a map of friction and ease, not a verdict to marry or leave.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="eyebrow mb-3 text-brand-bronze">Science of the Cards (what we claim)</h2>
        <TableScroll label="What Card Blueprints claims and does not claim">
        <table className="w-full min-w-[32rem] border-collapse text-left text-sm text-brand-ink-soft">
          <caption className="sr-only">Claims versus non-claims for Cardology on Card Blueprints</caption>
          <thead>
            <tr className="border-b border-white/15 text-brand-ink">
              <th className="py-2 pr-3 font-serif text-base" scope="col">We claim</th>
              <th className="py-2 font-serif text-base" scope="col">We do not claim</th>
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
        </TableScroll>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          If two calculators disagree, open the{" "}
          <Link href="/methodology" className="text-brand-oxblood underline underline-offset-4">
            methodology
          </Link>
          , re-run the date, and trust the method you can audit.
        </p>
      </section>

      <section id="vs-cardology" className="mt-10 scroll-mt-10">
        <h2 className="eyebrow mb-3 text-brand-bronze">Destiny Cards language vs Card Blueprints</h2>
        <TableScroll label="Destiny Cards language versus Card Blueprints">
        <table className="w-full min-w-[36rem] border-collapse text-left text-sm text-brand-ink-soft">
          <caption className="sr-only">Destiny Cards terms mapped to Card Blueprints tools</caption>
          <thead>
            <tr className="border-b border-white/15 text-brand-ink">
              <th className="py-2 pr-3 font-serif text-base" scope="col">Idea</th>
              <th className="py-2 pr-3 font-serif text-base" scope="col">Destiny / Love Cards</th>
              <th className="py-2 font-serif text-base" scope="col">On Card Blueprints</th>
            </tr>
          </thead>
          <tbody>
            {langRows.map(([idea, dest, cb]) => (
              <tr key={idea} className="border-b border-white/10 align-top">
                <th className="py-3 pr-3 font-semibold text-brand-ink" scope="row">{idea}</th>
                <td className="py-3 pr-3">{dest}</td>
                <td className="py-3">{cb}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </TableScroll>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          Camp’s books remain a major doorway into this family. Card Blueprints is Cassidy Rice’s
          Cardology practice: free checkable tools, a published method, and one written report.
          Related tradition. Distinct product.
        </p>
      </section>

      <section id="vs-tarot" className="mt-10 scroll-mt-10">
        <h2 className="eyebrow mb-3 text-brand-bronze">Destiny Cards vs tarot</h2>
        <TableScroll label="Destiny Cards versus tarot birth cards">
        <table className="w-full min-w-[36rem] border-collapse text-left text-sm text-brand-ink-soft">
          <caption className="sr-only">Destiny Cards and Cardology versus tarot birth cards</caption>
          <thead>
            <tr className="border-b border-white/15 text-brand-ink">
              <th className="py-2 pr-3 font-serif text-base" scope="col">Dimension</th>
              <th className="py-2 pr-3 font-serif text-base" scope="col">Destiny Cards / Cardology</th>
              <th className="py-2 font-serif text-base" scope="col">Tarot birth cards</th>
            </tr>
          </thead>
          <tbody>
            {tarotRows.map(([dim, a, b]) => (
              <tr key={dim} className="border-b border-white/10 align-top">
                <th className="py-3 pr-3 font-semibold text-brand-ink" scope="row">{dim}</th>
                <td className="py-3 pr-3">{a}</td>
                <td className="py-3">{b}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </TableScroll>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          Full side-by-side:{" "}
          <Link href="/cardology-vs-tarot" className="text-brand-oxblood underline underline-offset-4">
            Cardology vs tarot
          </Link>
        </p>
      </section>

            <section id="faq" className="mt-10 scroll-mt-10">
        <h2 className="eyebrow mb-4 text-brand-bronze">FAQ</h2>
        <div className="space-y-4">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h3 className="font-serif text-lg text-brand-ink">{f.q}</h3>
              <p className="prose-reading mt-2 text-sm text-brand-ink-soft">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <FreeCourseCta source="destiny-cards" className="mt-10" />

      <p className="mt-8 text-sm text-brand-ink-soft">
        Related:{" "}
        <Link href="/what-is-cardology" className="text-brand-oxblood underline underline-offset-4">
          What is Cardology?
        </Link>
        {" · "}
        <Link href="/birth-card-calculator" className="text-brand-oxblood underline underline-offset-4">
          Free calculator
        </Link>
        {" · "}
        <Link href="/products/one-question-reading" className="text-brand-oxblood underline underline-offset-4">
          $13 One Question Reading
        </Link>
        {" · "}
        <Link href="/cardology-for-beginners" className="text-brand-oxblood underline underline-offset-4">
          Cardology for beginners
        </Link>
        {" · "}
        <Link href="/cardology-vs-tarot" className="text-brand-oxblood underline underline-offset-4">
          Cardology vs tarot
        </Link>
      </p>
    </SeoShell>
  );
}
