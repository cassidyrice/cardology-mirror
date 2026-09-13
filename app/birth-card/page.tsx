import type { Metadata } from "next";
import Link from "next/link";
import { FreeCourseCta } from "@/components/free-course/FreeCourseCta";
import { OfferCta } from "@/components/seo/OfferCta";
import { SeoHeroFan } from "@/components/seo/SeoHeroFan";
import { SeoShell } from "@/components/seo/SeoShell";
import { DeckMatrix } from "@/components/cards/DeckMatrix";
import {
  DEEP_DIVE_CALCULATOR_FORM_HREF,
  DEEP_DIVE_PRICE_LABEL,
  DEEP_DIVE_PRODUCT_NAME,
} from "@/lib/deep-dive";
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
    a: "In Cardology, a birth card is the one playing card your month and day map to in a fixed 52-card calendar system. The same birthday always returns the same card. It is not a greeting card and not a tarot Major Arcana calculation.",
  },
  {
    q: "How do I find my birth card?",
    a: "Use the free birth card calculator, or scan the Cardology chart. Entering your birthday returns the fixed birth card plus its planetary ruling card, with a link to the full meaning.",
  },
  {
    q: "Are Cardology birth cards the same as tarot birth cards?",
    a: "No. Cardology uses a standard 52-card playing deck — Hearts, Clubs, Diamonds, and Spades. Tarot birth-card systems usually calculate Major Arcana cards from a 78-card tarot deck.",
  },
  {
    q: "Does a birth card ever change?",
    a: "No. The birth card is fixed by month and day and stays the same for life. Timing cards and yearly periods can change, but the birth card remains the baseline pattern.",
  },
  {
    q: "What do the 52 birth cards mean?",
    a: "Each meaning combines suit and rank. Hearts emphasize relationships and emotion; Diamonds values and resources; Clubs mind and communication; Spades work, will, and transformation. Rank describes how that life domain moves.",
  },
  {
    q: "What is the One Question Reading?",
    a: "The free pages name your birth card and its pattern. The One Question Reading ($47) takes one decision you are circling and reads it from that card, this year's Long Range and Pluto cards, and the card you owe. About 600 words, written for you and emailed within 2 business days. One payment, no renewal.",
  },
];

const TITLE = "52 Cardology Card Meanings | All Birth Cards";
const DESCRIPTION =
  "Browse all 52 Cardology birth card meanings — suit, rank, shadow, exact birth dates. Playing cards, not tarot. Find yours free, then open the card.";
const OG_IMAGE = { url: "/og/birth-card.png", width: 1200, height: 630, alt: "All 52 birth cards — three aces fanned on paper" };

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

const SUIT_GLYPHS: Record<string, string> = {
  hearts: "♥", diamonds: "♦", clubs: "♣", spades: "♠",
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
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "Birth Cards", href: "/birth-card" }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <SeoHeroFan codes={["A♥", "A♣", "A♠"]} className="mb-5" />
      <h1 className="display mb-3 text-3xl text-bone">The 52 Cardology Birth Card Meanings</h1>
      <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5" data-ai-summary>
        <p className="eyebrow mb-2 text-gold">Direct answer</p>
        <p className="prose-reading text-mist">
          A Cardology birth card is the one playing card your birthday maps to in a
          fixed 52-card system. Same birthday, same card for life. This is a standard
          playing deck — not tarot and not a paper birthday card. Browse all 52 meanings
          below or use the free calculator to find yours. Each card also has a pip-only
          tattoo reference — the exact French-deck layout, on skin.{" "}
          <Link href="/playing-card-tattoo-meaning" className="text-gold underline underline-offset-4">
            All 52 pip tattoos
          </Link>
          .
        </p>
      </div>
      <p className="mb-3">
        <Link href="/birth-card-calculator" className="accent-button inline-block">
          Find your birth card free →
        </Link>
      </p>
      <p className="prose-reading mb-6 text-sm text-mist">
        After you have the card, the{" "}
        <Link href={DEEP_DIVE_CALCULATOR_FORM_HREF} className="text-gold underline underline-offset-4">
          {DEEP_DIVE_PRODUCT_NAME} · {DEEP_DIVE_PRICE_LABEL}
        </Link>{" "}
        reads one decision from it — your card, this year&rsquo;s cards, and the card
        you owe, written for you within 2 business days. One payment, no renewal.
      </p>
      <p className="mb-4 text-xs text-faint">
        By{" "}
        <Link href="/about" className="text-gold underline underline-offset-4">
          Cassidy Rice
        </Link>{" "}
        · Updated {updatedLabel(UPDATED)} ·{" "}
        <Link href="/editorial-policy" className="text-gold underline underline-offset-4">
          Editorial policy
        </Link>{" "}
        ·{" "}
        <Link href="/methodology" className="text-gold underline underline-offset-4">
          Calculation method
        </Link>
      </p>
      <p className="prose-reading mb-6 text-mist">
        Every birthday maps to exactly one of the 52 playing cards — your{" "}
        <strong>birth card</strong>. No quiz, no choosing: a fixed vocabulary for how you
        operate, whether you&rsquo;ve noticed it or not. Pick a card below, or{" "}
        <Link href="/birth-card-calculator" className="text-gold underline underline-offset-4">
          calculate yours
        </Link>
        {" "}or open the{" "}
        <Link href="/birth-card-calculator#cardology-chart" className="text-gold underline underline-offset-4">
          Cardology chart
        </Link>
        .
      </p>
      <p className="prose-reading mb-6 text-mist">
        Prefer to browse another way? Explore{" "}
        <a href={BIRTHDAY_DIRECTORY_PATH} className="text-gold underline underline-offset-4">
          birthdays by date
        </a>{" "}
        or{" "}
        <a href={COMPATIBILITY_DIRECTORY_PATH} className="text-gold underline underline-offset-4">
          every two-card pairing
        </a>
        .
      </p>

      <nav className="mb-10 flex flex-wrap gap-2 text-[0.65rem] uppercase tracking-wider2">
        {groups.map((g) => (
          <a
            key={g.suit}
            href={`#${g.suit}`}
            className="rounded-full border border-white/10 px-3 py-1 text-faint transition hover:border-gold hover:text-gold"
          >
            {SUIT_GLYPHS[g.suit]} {g.suit}
          </a>
        ))}
      </nav>

      <section className="mb-10 rounded-2xl border border-gold/20 bg-white/[0.04] p-5" aria-labelledby="popular-card-meanings">
        <h2 id="popular-card-meanings" className="eyebrow mb-3 text-gold">Popular card meanings</h2>
        <p className="prose-reading mb-4 text-sm text-mist">
          Start with the cards people are reading most, then browse the full deck below.
        </p>
        <ul className="flex flex-wrap gap-2 text-sm">
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
              <Link href={href} className="inline-block rounded-full border border-gold/30 px-4 py-2 text-gold transition hover:border-gold hover:text-bone">
                {label} →
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <DeckMatrix />

      <div className="space-y-12">
        {groups.map((g) => (
          <section key={g.suit} id={g.suit} className="scroll-mt-10">
            <h2 className="eyebrow mb-4 text-gold">
              {SUIT_GLYPHS[g.suit]} {cap(g.suit)} · {g.domain}
            </h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {g.cards.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/birth-card/${c.slug}`}
                    className="card-surface group relative flex flex-col items-center overflow-hidden p-3 text-center transition-all hover:border-gold/50 hover:shadow-[0_0_20px_-5px_rgba(217,178,106,0.3)]"
                  >
                    <img
                      src={`/share-cards/faces/${c.slug}.png`}
                      alt={`${c.label} playing card`}
                      width={1000}
                      height={1500}
                      loading="lazy"
                      decoding="async"
                      className="w-full rounded-[6px] border border-brand-line transition-transform duration-200 group-hover:-translate-y-1"
                    />
                    <span className="mt-2 block font-serif text-sm text-bone">
                      {c.label}
                    </span>
                    <span className="mt-0.5 block text-[0.6rem] text-faint">
                      {c.label} meaning
                    </span>
                    {c.title && (
                      <span className="mt-0.5 block text-[0.6rem] uppercase tracking-wider text-faint">
                        {c.title}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="mt-12" id="faq">
        <h2 className="eyebrow mb-4 text-gold">Birth card FAQ</h2>
        <div className="space-y-4">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h3 className="font-serif text-lg text-bone">{f.q}</h3>
              <p className="prose-reading mt-2 text-sm text-mist">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <OfferCta className="mt-12" />

      <FreeCourseCta source="card-meanings" className="mt-8" />
    </SeoShell>
  );
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
