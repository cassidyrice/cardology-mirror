import type { Metadata } from "next";
import Link from "next/link";
import { SeoShell } from "@/components/seo/SeoShell";
import { TableScroll } from "@/components/seo/TableScroll";
import { SITE_NAME } from "@/lib/site";
import { PAGE_UPDATED_DATES } from "@/lib/page-dates";
import { updatedLabel } from "@/lib/page-updated";

const UPDATED = PAGE_UPDATED_DATES["/cardology-vs-tarot"];

const TITLE = "Cardology vs Tarot: What's the Difference?";
const DESCRIPTION =
  "Cardology vs tarot: 52 playing cards vs a 78-card deck. A fixed birth card vs a shuffled draw. Suit maps, and which one to use. Pick one and stop dithering.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/cardology-vs-tarot" },
  openGraph: {
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    url: "/cardology-vs-tarot",
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Card Blueprints" }],
  },
};

const rows = [
  ["Deck", "Standard 52 playing cards (+ Joker for Dec 31)", "78 cards (22 Major + 56 Minor)"],
  ["Birth significator", "Fixed by birthday math. Same date, same card, forever", "Often Major Arcana pairs from name or date formulas. Not the same system"],
  ["How a reading starts", "Calculate first. Spreads later, if you want them", "Usually shuffle, draw, hope"],
  ["Suits", "Hearts, Clubs, Diamonds, Spades", "Cups, Wands, Pentacles, Swords (minor)"],
  ["Big archetypes", "Calendar structure, ranks, periods, karma links", "Major Arcana trumps"],
  ["Best for", "Birthday identity, timing chapters, two-person maps", "Open-ended narrative questions and symbolic storytelling"],
  ["Checkability", "Two people check the same birthday, get the same card", "Draws vary by shuffle. Birth-card methods vary by teacher"],
];

const faqs = [
  {
    q: "What is the difference between Cardology and tarot?",
    a: "Cardology uses a 52-card playing deck. Your birth card is locked to your birthday with fixed math. Tarot uses a 78-card deck and usually starts with a shuffle. The suits overlap with tarot’s minors. Cardology does not use the Major Arcana. No shuffle to blame.",
  },
  {
    q: "Is Cardology better than tarot?",
    a: "Neither wins everywhere. Use Cardology for a deterministic birthday map, compatibility between two dates, or calendar timing. Use tarot for shuffled narrative symbolism and Major Arcana themes. Wanting a winner is its own little tell.",
  },
  {
    q: "Can I use both Cardology and tarot?",
    a: "Yes. Plenty of people keep Cardology for identity and timing, and tarot for open questions. Just do not mix the math. A tarot “birth card” pair is not the same object as a Cardology playing-card birth card.",
  },
  {
    q: "Is Cardology a form of cartomancy?",
    a: "Yes. Cartomancy is the umbrella for reading cards. Tarot is one branch. Playing-card reading is another. Cardology is the deterministic birthday branch of playing-card cartomancy. Same family. Different group chat.",
  },
  {
    q: "Which should a beginner learn first?",
    a: "If your question is “what card am I based on my birthday” with playing cards, start with Cardology and the free calculator. If you already own a tarot deck and want freeform spreads, start with tarot. Then add Cardology for birthday structure. Starting is the hard part. You knew that.",
  },
];

export default function CardologyVsTarotPage() {
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
    mainEntityOfPage: "https://cardblueprints.com/cardology-vs-tarot",
  };

  return (
    <SeoShell
      crumb={[
        { label: "Home", href: "/" },
        { label: "What is Cardology?", href: "/what-is-cardology" },
        { label: "Cardology vs Tarot", href: "/cardology-vs-tarot" },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(article) }} />

      <h1 className="display mb-3 text-3xl text-brand-ink">Cardology vs Tarot</h1>
      <div className="mb-6 rounded-2xl border border-brand-line bg-brand-ivory/70 p-5" data-ai-summary>
        <p className="type-eyebrow mb-2 !text-brand-bronze">Direct answer</p>
        <p className="prose-reading text-brand-ink-soft">
          <strong>Cardology</strong> maps a birthday to one card in a standard 52-card
          playing deck with fixed math. <strong>Tarot</strong> uses a 78-card deck and
          usually begins with a shuffle. Related roots. Different jobs. Stop asking
          them to be the same person.
        </p>
      </div>
      <p className="mb-6 text-xs text-brand-ink-soft">
        By Cassidy Rice · Updated {updatedLabel(UPDATED)} ·{" "}
        <Link href="/editorial-policy" className="text-brand-oxblood underline underline-offset-4">
          Editorial policy
        </Link>
      </p>
      <p className="prose-reading mb-8 text-brand-ink-soft">
        Search lumps “birth cards,” cartomancy and tarot into one pile.
        You have been reading the wrong pile. This page pulls them apart
        so you can pick the right tool. For the wider umbrella, see{" "}
        <Link href="/cartomancy-vs-tarot" className="text-brand-oxblood underline underline-offset-4">
          cartomancy vs tarot
        </Link>
        . If you are new and slightly lost, use{" "}
        <Link href="/cardology-for-beginners" className="text-brand-oxblood underline underline-offset-4">
          Cardology for beginners
        </Link>
        .
      </p>

      <section className="mt-4">
        <h2 className="type-eyebrow mb-3 !text-brand-bronze">Side-by-side</h2>
        <TableScroll label="Cardology versus tarot">
        <table className="w-full min-w-[36rem] border-collapse text-left text-sm text-brand-ink-soft">
          <caption className="sr-only">Cardology versus tarot by deck, method, and use</caption>
          <thead>
            <tr className="border-b border-brand-line text-brand-ink">
              <th className="py-2 pr-3 font-serif text-base" scope="col">Dimension</th>
              <th className="py-2 pr-3 font-serif text-base" scope="col">Cardology</th>
              <th className="py-2 font-serif text-base" scope="col">Tarot</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([dim, c, t]) => (
              <tr key={dim} className="border-b border-brand-line align-top">
                <th className="py-3 pr-3 font-semibold text-brand-ink" scope="row">{dim}</th>
                <td className="py-3 pr-3">{c}</td>
                <td className="py-3">{t}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </TableScroll>
      </section>

      <section className="mt-10">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">Suit map (minors ↔ playing cards)</h2>
        <ul className="prose-reading space-y-1.5 text-brand-ink-soft">
          <li><span className="text-[#8e321f]">♥ Hearts</span> ↔ Cups: feelings, relationships, the text you have not sent</li>
          <li><span className="text-[#14110d]">♣ Clubs</span> ↔ Wands: mind, drive, communication</li>
          <li><span className="text-[#8e321f]">♦ Diamonds</span> ↔ Pentacles: values, resources, what you think you are worth</li>
          <li><span className="text-[#14110d]">♠ Spades</span> ↔ Swords: work, will, transformation</li>
        </ul>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          That map helps translators. That is all it does.
          A Queen of Diamonds birth card is not a tarot Queen of Pentacles pull.
          Different deck. Different procedure. Different claim.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">When to choose Cardology</h2>
        <ul className="prose-reading list-disc space-y-1.5 pl-5 text-brand-ink-soft">
          <li>You want “what is my birth card” from a birthday, and you want to check the math.</li>
          <li>You want two-birthday compatibility without a shuffle deciding for you.</li>
          <li>You want yearly and period language built from the same deck math.</li>
          <li>You trust a pattern map more than a story. Fair.</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">When to choose tarot</h2>
        <ul className="prose-reading list-disc space-y-1.5 pl-5 text-brand-ink-soft">
          <li>You want Major Arcana archetypes in the spread, not a calendar.</li>
          <li>The question is open-ended and wants a fresh draw. Not a birthday.</li>
          <li>You already practice tarot, not Cardology, and want the imagery first.</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">Common mix-up: “birth card calculator”</h2>
        <p className="prose-reading text-brand-ink-soft">
          Google keeps handing you tarot birth-card tools for that query.
          Those calculators answer a different question. You noticed, eventually.
          Card Blueprints&rsquo;{" "}
          <Link href="/birth-card-calculator" className="text-brand-oxblood underline underline-offset-4">
            birth card calculator
          </Link>{" "}
          is playing-card Cardology only. Not tarot pairs. Not stationery birth
          announcements. The math, if you need receipts:{" "}
          <Link href="/methodology" className="text-brand-oxblood underline underline-offset-4">
            methodology
          </Link>
          .
        </p>
      </section>

      <section className="mt-10">
        <h2 className="type-eyebrow mb-4 !text-brand-bronze">FAQ</h2>
        <div className="space-y-4">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-2xl border border-brand-line bg-brand-ivory/70 p-4">
              <h3 className="font-serif text-lg text-brand-ink">{f.q}</h3>
              <p className="prose-reading mt-2 text-sm text-brand-ink-soft">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="card-surface mt-10 rounded-2xl border !border-brand-line p-5">
        <p className="font-serif text-base text-brand-ink">Try the Cardology side. 30 seconds. You have spent longer on worse.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/birth-card-calculator" className="ink-button">
            Find your birth card, free →
          </Link>
        </div>
      </div>

      <p className="mt-8 text-sm text-brand-ink-soft">
        Related:{" "}
        <Link href="/what-is-cardology" className="text-brand-oxblood underline underline-offset-4">
          What is Cardology?
        </Link>
        {" · "}
        <Link href="/how-to-read-playing-cards" className="text-brand-oxblood underline underline-offset-4">
          How to read playing cards
        </Link>
        {" · "}
        <Link href="/cartomancy-vs-tarot" className="text-brand-oxblood underline underline-offset-4">
          Cartomancy vs tarot
        </Link>
      </p>
    </SeoShell>
  );
}
