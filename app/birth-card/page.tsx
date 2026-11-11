import type { Metadata } from "next";
import Link from "next/link";
import { OfferCta } from "@/components/seo/OfferCta";
import { SeoHeroFan } from "@/components/seo/SeoHeroFan";
import { SeoShell, StageCard } from "@/components/seo/SeoShell";
import "@/app/card-pages.css";
import { InView } from "@/components/motion/InView";
import { DeckMatrix } from "@/components/cards/DeckMatrix";
import { cardsBySuit } from "@/lib/seo-cards";
import {
  BIRTHDAY_DIRECTORY_PATH,
  COMPATIBILITY_DIRECTORY_PATH,
  SITE_URL,
} from "@/lib/site";
import { PAGE_UPDATED_DATES } from "@/lib/page-dates";
import { updatedLabel } from "@/lib/page-updated";

const UPDATED = PAGE_UPDATED_DATES["/birth-card"];

const faqs = [
  {
    q: "What is a birth card?",
    a: "In Cardology, a birth card is the one playing card your month and day map to in a fixed 52-card calendar system. Same birthday, same card, every time. It is not a greeting card. It is not a tarot Major Arcana calculation either. Nobody is singing.",
  },
  {
    q: "How do I find my birth card?",
    a: "Use the free birth card calculator, or scan the Cardology chart. Type in your birthday. You get the fixed birth card, its planetary ruling card, and a link to the full meaning. Then you get to sit with it.",
  },
  {
    q: "Are Cardology birth cards the same as tarot birth cards? Not even close.",
    a: "No. Cardology uses a standard 52-card playing deck: Hearts, Clubs, Diamonds, and Spades. Birth-card systems built on tarot, not playing cards, usually calculate Major Arcana cards from a 78-card deck. Different deck. Different math.",
  },
  {
    q: "Does a birth card ever change?",
    a: "No. The birth card is fixed by month and day and stays the same for life. Timing cards and yearly periods change. The birth card stays the baseline pattern, no matter how many times you rebrand.",
  },
  {
    q: "What do the 52 birth cards mean?",
    a: "Each meaning combines suit and rank. Hearts are relationships and emotion. Diamonds are values and resources. Clubs are mind and communication. Spades are work, will, and transformation. Rank describes how that part of your life moves, or refuses to.",
  },
  {
    q: "Can I get a personal reading?",
    a: "Yes. Cass prepares the Chemistry Check ($39) for two people’s cards and the 12-Month Timing Map ($26) for one solo timing question, delivered by email or text message. Read your free card meaning first. Then decide what you actually want to ask.",
  },
];

const TITLE = "52 Cardology Card Meanings | All Birth Cards";
const DESCRIPTION =
  "All 52 Cardology birth card meanings: suit, rank, shadow, exact birth dates. Playing cards, not tarot. Find yours free. Open it. Feel seen.";
const OG_IMAGE = { url: "/og/birth-card.png", width: 1200, height: 630, alt: "All 52 birth cards: three aces fanned on paper" };

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/birth-card" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/birth-card",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

export default function BirthCardIndex() {
  const groups = cardsBySuit();
  const cards = groups.flatMap((group) => group.cards);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "The 52 Birth Cards",
    description: metadata.description,
    url: `${SITE_URL}/birth-card`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: cards.map((card, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: `${card.label} Birth Card Meaning`,
        url: `${SITE_URL}/birth-card/${card.slug}`,
      })),
    },
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "All 52 Cardology Birth Cards",
    description: metadata.description,
    author: { "@type": "Person", name: "Cassidy Rice", url: `${SITE_URL}/about` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    dateModified: UPDATED,
    mainEntityOfPage: `${SITE_URL}/birth-card`,
  };
  return (
    <SeoShell
      crumb={[{ label: "Home", href: "/" }, { label: "Birth Cards", href: "/birth-card" }]}
      stage={<StageCard slug="ace-of-hearts" label="Ace of Hearts" />}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <div className="card-page">
      <header className="card-title">
        <SeoHeroFan codes={["A♥", "A♣", "A♠"]} className="card-title-fan" />
        <h1 className="rise">The 52 Cardology Birth Card Meanings</h1>
        <p className="card-title-lead rise-2">Playing cards, not tarot. One card per birthday, for life.</p>
      </header>
      <div className="card-answer rise-3" data-ai-summary>
        <p className="type-eyebrow mb-2 !text-brand-bronze">The short answer</p>
        <p className="prose-reading text-brand-ink-soft">
          A Cardology birth card is the one playing card your birthday maps to in a
          fixed 52-card system. Same birthday, same card for life. This is a standard
          playing deck. Not tarot. Not a paper birthday card. Not cardiology either,
          so your heart is fine. The meaning is a mirror of your default pattern, not a forecast.
          Each interpretation combines a suit (Hearts, Clubs, Diamonds or Spades) with a rank from
          Ace to King. Browse all 52 meanings below, or use the free calculator if
          you do not know your card yet. December 31 is the Joker exception and gets its own{" "}
          <Link href="/birth-card/joker" className="editorial-link">
            Joker birth card guide
          </Link>
          .
        </p>
      </div>
      <section id="how-do-i-find-my-birth-card" className="card-section">
        <h2 className="card-h2">How do I find my birth card?</h2>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          Month and day are enough. The free calculator returns the fixed playing
          card. The year is for timing layers, not the birth card. Keep your birth year to yourself.
        </p>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          Open the meaning on this page once you have the card. To see how two
          cards collide, read{" "}
          <Link href="/cardology-compatibility" className="editorial-link">
            Cardology compatibility
          </Link>
          . The system behind the map is{" "}
          <Link href="/what-is-cardology" className="editorial-link">
            what Cardology is
          </Link>
          .
        </p>
      </section>
      <p className="mb-3 mt-6">
        <Link href="/birth-card-calculator" className="accent-button inline-block">
          Find your birth card free
        </Link>
      </p>
      <p className="prose-reading mb-6 text-sm text-brand-ink-soft">Read the card as a set of possible patterns. A strength. A pitfall. A question you keep dodging. For a closer look at one of your relationships, <Link href="/#readings" className="editorial-link">choose a personal reading with Cass</Link>.</p>
      <p className="card-byline">
        By{" "}
        <Link href="/about" className="editorial-link">
          Cassidy Rice
        </Link>. Updated {updatedLabel(UPDATED)}.{" "}
        <Link href="/editorial-policy" className="editorial-link">
          Editorial policy
        </Link>
        {" and "}
        <Link href="/methodology" className="editorial-link">
          calculation method
        </Link>.
      </p>
      <p className="prose-reading mb-6 text-brand-ink-soft">
        Your month and day determine your <strong>birth card</strong>. The
        interpretation is where the thinking starts, not where it ends. Pick a card below, or{" "}
        <Link href="/birth-card-calculator" className="editorial-link">
          calculate yours
        </Link>
        {" "}or open the{" "}
        <Link href="/birth-card-calculator#cardology-chart" className="editorial-link">
          Cardology chart
        </Link>
        .
      </p>
      <p className="prose-reading mb-6 text-brand-ink-soft">
        Would rather snoop another way? Explore{" "}
        <a href={BIRTHDAY_DIRECTORY_PATH} className="editorial-link">
          birthdays by date
        </a>{" "}
        or{" "}
        <a href={COMPATIBILITY_DIRECTORY_PATH} className="editorial-link">
          every two-card pairing
        </a>
        .
      </p>

      <nav className="card-suit-nav" aria-label="Jump to a suit">
        {groups.map((g) => (
          <a key={g.suit} href={`#${g.suit}`} className="editorial-link">
            {cap(g.suit)}
          </a>
        ))}
      </nav>

      <section className="card-section" aria-labelledby="popular-card-meanings">
        <h2 id="popular-card-meanings" className="card-h2">Popular card meanings</h2>
        <p className="prose-reading mb-4">
          The cards people are reading most, probably about someone else. The full deck is below.
        </p>
        <ul className="card-popular">
          {[
            ["Joker birth card", "/birth-card/joker"],
            ["Ace of Hearts meaning", "/birth-card/ace-of-hearts"],
            ["10 of Hearts meaning", "/birth-card/10-of-hearts"],
            ["10 of Diamonds meaning", "/birth-card/10-of-diamonds"],
            ["Queen of Hearts meaning", "/birth-card/queen-of-hearts"],
            ["Queen of Clubs meaning", "/birth-card/queen-of-clubs"],
            ["7 of Spades meaning", "/birth-card/7-of-spades"],
            ["King of Clubs meaning", "/birth-card/king-of-clubs"],
            ["Ace of Spades meaning", "/birth-card/ace-of-spades"],
            ["Queen of Spades meaning", "/birth-card/queen-of-spades"],
            ["6 of Diamonds meaning", "/birth-card/6-of-diamonds"],
            ["10 of Clubs meaning", "/birth-card/10-of-clubs"],
            ["2 of Hearts meaning", "/birth-card/2-of-hearts"],
            ["3 of Clubs meaning", "/birth-card/3-of-clubs"],
          ].map(([label, href]) => (
            <li key={href}>
              <Link href={href} className="editorial-link">
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <DeckMatrix />

      <section className="card-section" aria-labelledby="read-card-meaning">
        <h2 id="read-card-meaning" className="card-h2">How to read a card meaning without making it your whole personality</h2>
        <ol className="prose-reading mt-4 list-decimal space-y-2 pl-5">
          <li>Start with the suit. Hearts for emotion. Clubs for mind and communication. Diamonds for values. Spades for work and transformation.</li>
          <li>Read the rank next to the suit. An Ace starts something in that area. A King asks how you lead in it, or whether you just like the chair.</li>
          <li>Hold the interpretation up to one thing that happened this week. Keep the question that explains your choices. Drop what does not fit. Do not argue with the part that does.</li>
        </ol>
      </section>

      <div className="card-suits">
        {groups.map((g) => (
          <InView as="section" key={g.suit} id={g.suit} className="card-section scroll-mt-10">
            <h2 className="card-h2" data-rise style={{ "--rise-i": 0 } as React.CSSProperties}>
              {cap(g.suit)}: {g.domain}
            </h2>
            <ul className="card-grid">
              {g.cards.map((c) => (
                <li key={c.slug}>
                  <Link href={`/birth-card/${c.slug}`} className="card-tile">
                    <img
                      src={`/share-cards/faces/${c.slug}.png`}
                      alt={`${c.label} playing card`}
                      width={1000}
                      height={1500}
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="card-tile-name">{c.label} meaning</span>
                    {c.title && <span className="card-tile-title">{c.title}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </InView>
        ))}
      </div>

      <section className="card-section" id="faq">
        <h2 className="card-h2">Birth card FAQ, asked at 2am</h2>
        <div className="card-faq">
          {faqs.map((f) => (
            <div key={f.q}>
              <h3>{f.q}</h3>
              <p className="prose-reading mt-2">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="prose-reading mt-8 text-sm text-brand-ink-soft">
        Thinking about putting a card on your body permanently?{" "}
        <Link href="/playing-card-tattoo-meaning" className="editorial-link">
          Browse the playing-card tattoo references
        </Link>.
      </p>

      <OfferCta className="mt-12" />
      </div>
    </SeoShell>
  );
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
