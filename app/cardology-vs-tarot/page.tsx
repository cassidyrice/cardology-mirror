import type { Metadata } from "next";
import Link from "next/link";
import { FreeCourseCta } from "@/components/free-course/FreeCourseCta";
import { SeoShell } from "@/components/seo/SeoShell";
import { TableScroll } from "@/components/seo/TableScroll";
import { ReadingBridge } from "@/components/seo/ReadingBridge";
import { SITE_NAME } from "@/lib/site";

const TITLE = "Cardology vs Tarot: What's the Difference?";
const DESCRIPTION =
  "Cardology vs tarot explained: 52 playing cards vs 78-card deck, fixed birthday birth cards vs shuffled draws, suit maps, and which system to use when.";

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
  ["Birth significator", "Fixed by birthday math — same date, same card forever", "Often Major Arcana pairs from name/date formulas; not the same system"],
  ["How a reading starts", "Calculate first; optional spreads later", "Usually shuffle and draw"],
  ["Suits", "Hearts, Clubs, Diamonds, Spades", "Cups, Wands, Pentacles, Swords (minor)"],
  ["Big archetypes", "Calendar structure, ranks, periods, karma links", "Major Arcana trumps"],
  ["Best for", "Birthday identity, timing chapters, two-person maps", "Open-ended narrative questions and symbolic storytelling"],
  ["Checkability", "Two people can verify the same birthday → same card", "Draws vary by shuffle; birth-card methods vary by teacher"],
];

const faqs = [
  {
    q: "What is the difference between Cardology and tarot?",
    a: "Cardology uses a 52-card playing deck and locks your birth card to your birthday with fixed math. Tarot uses a 78-card deck and usually starts with a shuffle. Suit meanings overlap with tarot’s minors, but Cardology does not rely on Major Arcana.",
  },
  {
    q: "Is Cardology better than tarot?",
    a: "Neither is universally better. Use Cardology when you want a deterministic birthday map, compatibility between two dates, or calendar timing. Use tarot when you want shuffled narrative symbolism and Major Arcana themes.",
  },
  {
    q: "Can I use both Cardology and tarot?",
    a: "Yes. Many people keep Cardology for identity and timing, and tarot for open questions. Just don’t mix the math — a tarot “birth card” pair is not the same object as a Cardology playing-card birth card.",
  },
  {
    q: "Is Cardology a form of cartomancy?",
    a: "Yes. Cartomancy is the umbrella for reading cards. Tarot is one branch; playing-card reading is another. Cardology is the deterministic birthday branch of playing-card cartomancy.",
  },
  {
    q: "Which should a beginner learn first?",
    a: "If you care about “what card am I based on my birthday” with playing cards, start with Cardology and the free calculator. If you already own a tarot deck and want freeform spreads, start with tarot — then add Cardology for birthday structure.",
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
    dateModified: "2026-08-07",
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

      <h1 className="display mb-3 text-3xl text-bone">Cardology vs Tarot</h1>
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5" data-ai-summary>
        <p className="eyebrow mb-2 text-gold">Direct answer</p>
        <p className="prose-reading text-mist">
          <strong>Cardology</strong> maps a birthday to one card in a standard 52-card
          playing deck with fixed math. <strong>Tarot</strong> uses a 78-card deck and
          usually begins with a shuffle. Related roots, different jobs.
        </p>
      </div>
      <p className="mb-6 text-xs text-faint">
        By Cassidy Rice · Updated August 7, 2026 ·{" "}
        <Link href="/editorial-policy" className="text-gold underline underline-offset-4">
          Editorial policy
        </Link>
      </p>
      <p className="prose-reading mb-8 text-mist">
        Search often lumps “birth cards,” cartomancy, and tarot together. This page
        separates them so you can pick the right tool. For the wider umbrella, see{" "}
        <Link href="/cartomancy-vs-tarot" className="text-gold underline underline-offset-4">
          cartomancy vs tarot
        </Link>
        . For a first path in this system, use{" "}
        <Link href="/cardology-for-beginners" className="text-gold underline underline-offset-4">
          Cardology for beginners
        </Link>
        .
      </p>

      <section className="mt-4">
        <h2 className="eyebrow mb-3 text-gold">Side-by-side</h2>
        <TableScroll label="Cardology versus tarot">
        <table className="w-full min-w-[36rem] border-collapse text-left text-sm text-mist">
          <caption className="sr-only">Cardology versus tarot by deck, method, and use</caption>
          <thead>
            <tr className="border-b border-white/15 text-bone">
              <th className="py-2 pr-3 font-serif text-base" scope="col">Dimension</th>
              <th className="py-2 pr-3 font-serif text-base" scope="col">Cardology</th>
              <th className="py-2 font-serif text-base" scope="col">Tarot</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([dim, c, t]) => (
              <tr key={dim} className="border-b border-white/10 align-top">
                <th className="py-3 pr-3 font-semibold text-bone" scope="row">{dim}</th>
                <td className="py-3 pr-3">{c}</td>
                <td className="py-3">{t}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </TableScroll>
      </section>

      <section className="mt-10">
        <h2 className="eyebrow mb-2 text-gold">Suit map (minors ↔ playing cards)</h2>
        <ul className="prose-reading space-y-1.5 text-mist">
          <li><span className="text-[#8e321f]">♥ Hearts</span> ↔ Cups — emotion &amp; relationships</li>
          <li><span className="text-[#14110d]">♣ Clubs</span> ↔ Wands — mind, energy &amp; communication</li>
          <li><span className="text-[#8e321f]">♦ Diamonds</span> ↔ Pentacles — values &amp; resources</li>
          <li><span className="text-[#14110d]">♠ Spades</span> ↔ Swords — work, will &amp; transformation</li>
        </ul>
        <p className="prose-reading mt-3 text-mist">
          That map helps translators. It does not make a Queen of Diamonds birth card
          the same object as a tarot Queen of Pentacles pull — different deck, different
          procedure, different claim.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">When to choose Cardology</h2>
        <ul className="prose-reading list-disc space-y-1.5 pl-5 text-mist">
          <li>You want “what is my birth card” from a birthday, checkably.</li>
          <li>You want two-birthday compatibility without a shuffle.</li>
          <li>You care about yearly/period language built from the same deck math.</li>
          <li>You prefer pattern maps over open symbolic storytelling.</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">When to choose tarot</h2>
        <ul className="prose-reading list-disc space-y-1.5 pl-5 text-mist">
          <li>You want Major Arcana archetypes in the spread.</li>
          <li>The question is open-ended and benefits from a fresh draw.</li>
          <li>You already practice tarot and want narrative imagery first.</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">Common mix-up: “birth card calculator”</h2>
        <p className="prose-reading text-mist">
          Google often ranks tarot birth-card tools for that query. Those calculators
          answer a different question. Card Blueprints&rsquo;{" "}
          <Link href="/birth-card-calculator" className="text-gold underline underline-offset-4">
            birth card calculator
          </Link>{" "}
          is playing-card Cardology only — not tarot pairs, not stationery birth
          announcements. Method detail:{" "}
          <Link href="/methodology" className="text-gold underline underline-offset-4">
            methodology
          </Link>
          .
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
        <p className="font-serif text-base text-bone">Try the Cardology side in 30 seconds</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/birth-card-calculator" className="inline-block rounded-full bg-foil px-5 py-2 font-serif text-sm text-ink">
            Free birth card calculator →
          </Link>
          <Link href="/products/personal-card-blueprint" className="inline-block rounded-full border border-gold/30 px-5 py-2 font-serif text-sm text-gold">
            Personal Blueprint — $13 →
          </Link>
        </div>
      </div>

      <FreeCourseCta source="cardology-vs-tarot" className="mt-10" />
      <ReadingBridge variant="general" className="mt-8" />

      <p className="mt-8 text-sm text-mist">
        Related:{" "}
        <Link href="/what-is-cardology" className="text-gold underline underline-offset-4">
          What is Cardology?
        </Link>
        {" · "}
        <Link href="/how-to-read-playing-cards" className="text-gold underline underline-offset-4">
          How to read playing cards
        </Link>
        {" · "}
        <Link href="/cartomancy-vs-tarot" className="text-gold underline underline-offset-4">
          Cartomancy vs tarot
        </Link>
      </p>
    </SeoShell>
  );
}
