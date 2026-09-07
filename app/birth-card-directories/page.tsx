import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { SITE_URL } from "@/lib/site";
import { PAGE_UPDATED_DATES } from "@/lib/page-dates";
import { updatedLabel } from "@/lib/page-updated";

const UPDATED = PAGE_UPDATED_DATES["/birth-card-directories"];

const TITLE = "Birth-Card Directories: Every Cardology Coordinate We Publish";
const DESCRIPTION =
  "Every birth-card directory on Cardblueprints — senators, Nobel laureates, Olympians, Oscar winners, astronauts and more. 4,000+ people and places, each with the card for their calendar date.";
const OG_IMAGE = {
  url: "/og/default.png",
  width: 1200,
  height: 630,
  alt: "Card Blueprints birth-card directories",
};

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/birth-card-directories" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/birth-card-directories",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

type Directory = {
  label: string;
  href: string;
  pages: number;
  blurb: string;
};

/**
 * Every isolated directory, grouped the way a reader would look for one.
 *
 * These are served by the cardblueprints-path-split Worker from their own
 * Cloudflare Pages projects, not by this Next app, so every link here must be a
 * plain <a>. Keep in sync with `HUBS` in
 * cardblueprints-workers/path-split/worker.js: a directory listed here but not
 * routed there is a link to a 404.
 */
const GROUPS: { heading: string; note: string; items: Directory[] }[] = [
  {
    heading: "Public office",
    note: "People who held a named public post, from the founding to the current Congress.",
    items: [
      { label: "US Senators", href: "/senators", pages: 99, blurb: "The sitting Senate." },
      { label: "US Governors", href: "/governors", pages: 49, blurb: "Sitting state governors." },
      { label: "US Cabinet", href: "/cabinet", pages: 16, blurb: "The current Cabinet." },
      { label: "Supreme Court Justices", href: "/scotus", pages: 9, blurb: "The sitting Court." },
      {
        label: "House Committee Chairs",
        href: "/house-chairs",
        pages: 29,
        blurb: "Chairs of the standing House committees.",
      },
      {
        label: "Declaration Signers",
        href: "/signers",
        pages: 44,
        blurb: "Signers of the Declaration of Independence with a day-precision birth date.",
      },
    ],
  },
  {
    heading: "Prizes and honours",
    note: "People named by a prize committee, listed by the award that named them.",
    items: [
      { label: "Nobel Laureates", href: "/nobel", pages: 954, blurb: "Every laureate, all six prizes." },
      {
        label: "Academy Award Winners",
        href: "/oscars",
        pages: 166,
        blurb: "Best Actor and Best Actress winners.",
      },
      { label: "Emmy Winners", href: "/emmys", pages: 159, blurb: "Lead acting Emmy winners." },
      { label: "Tony Winners", href: "/tonys", pages: 256, blurb: "Lead acting Tony winners." },
      {
        label: "Grammy Album of the Year",
        href: "/grammys/aoty",
        pages: 89,
        blurb: "Credited artists on every Album of the Year.",
      },
      {
        label: "Pulitzer Prize for Fiction",
        href: "/pulitzer/fiction",
        pages: 90,
        blurb: "Every winning novelist.",
      },
      {
        label: "Kennedy Center Honors",
        href: "/kennedy-center-honors",
        pages: 259,
        blurb: "Every individual honoree.",
      },
      {
        label: "TIME Person of the Year",
        href: "/time-person-of-the-year",
        pages: 74,
        blurb: "Named people only — concept years are held back.",
      },
    ],
  },
  {
    heading: "Sport and flight",
    note: "Records set on a field, a track or a launch pad.",
    items: [
      {
        label: "Summer Olympic Medalists",
        href: "/olympics/summer",
        pages: 541,
        blurb: "Athletes on Wikipedia's multiple-gold table.",
      },
      {
        label: "Winter Olympic Medalists",
        href: "/olympics/winter",
        pages: 30,
        blurb: "Athletes with eight or more Winter medals.",
      },
      {
        label: "Pro Football Hall of Fame",
        href: "/nfl-hof",
        pages: 308,
        blurb: "Every inductee with a verified birth date.",
      },
      {
        label: "Rock & Roll Hall of Fame",
        href: "/rock-hall",
        pages: 753,
        blurb: "Inducted performers, individually.",
      },
      { label: "MLB Clubs", href: "/mlb", pages: 30, blurb: "Each club's founding date." },
      {
        label: "NASA Astronauts",
        href: "/astronauts",
        pages: 221,
        blurb: "Astronauts who have flown.",
      },
    ],
  },
  {
    heading: "Places and dates",
    note: "Not people. The same calendar formula, applied to a founding or a fixed date.",
    items: [
      { label: "US States", href: "/states", pages: 50, blurb: "Each state's date of admission." },
      { label: "National Parks", href: "/parks", pages: 63, blurb: "Each park's establishment date." },
      { label: "Federal Holidays", href: "/holidays", pages: 5, blurb: "Holidays on a fixed date." },
    ],
  },
];

const TOTAL_PAGES = GROUPS.reduce(
  (sum, group) => sum + group.items.reduce((n, item) => n + item.pages, 0),
  0,
);
const TOTAL_DIRECTORIES = GROUPS.reduce((n, group) => n + group.items.length, 0);

const faqs = [
  {
    q: "What is a birth-card directory?",
    a: "A list of people or places, each linked to the Cardology card for their calendar date. The card comes from the month and day only — the year is never used — so a directory is a coordinate list, not a set of readings.",
  },
  {
    q: "Does being on one of these pages mean the card caused anything?",
    a: "No. A card is a calendar coordinate, not a cause. Each page sets one line of the card's published language beside one sentence of the person's sourced record and says which rule paired them. It is a resemblance offered for you to weigh, and it forecasts nothing.",
  },
  {
    q: "Where do the facts on these pages come from?",
    a: "Birth dates come from Wikidata at day precision. Prose comes verbatim from the lead section of the Wikipedia article cited on the page, under CC BY-SA 4.0. Nothing biographical is written for these pages. Where sources disagree on a date, the person is left out rather than reconciled by guesswork.",
  },
  {
    q: "How do I find my own card?",
    a: "Use the birth-card calculator. It takes your month and day and returns your card, your karma cards and your planetary ruling card — the same fixed path every directory page shows.",
  },
];

export default function BirthCardDirectoriesPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      headline: TITLE,
      description: DESCRIPTION,
      author: { "@type": "Person", name: "Cassidy Rice", url: `${SITE_URL}/about` },
      publisher: { "@id": `${SITE_URL}/#organization` },
      dateModified: UPDATED,
      url: `${SITE_URL}/birth-card-directories`,
      mainEntityOfPage: `${SITE_URL}/birth-card-directories`,
      hasPart: GROUPS.flatMap((group) =>
        group.items.map((item) => ({
          "@type": "CollectionPage",
          name: item.label,
          url: `${SITE_URL}${item.href}`,
        })),
      ),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: { "@type": "Answer", text: faq.a },
      })),
    },
  ];

  return (
    <SeoShell
      crumb={[
        { label: "Home", href: "/" },
        { label: "Birth-card directories", href: "/birth-card-directories" },
      ]}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="max-w-3xl pb-8">
        <p className="oracle-eyebrow mb-4">Cardology directories</p>
        <h1 className="display text-4xl leading-none text-[#14110d] sm:text-6xl">
          Birth-Card Directories
        </h1>
        <div className="mt-6 border border-[#14110d]/15 bg-[#eadfcd]/70 p-5" data-ai-summary>
          <p className="oracle-eyebrow mb-2">Quick answer</p>
          <p className="text-base leading-relaxed text-[#3d352d]">
            {TOTAL_DIRECTORIES} directories, {TOTAL_PAGES.toLocaleString("en-US")} pages. Each one
            takes a published list &mdash; a Senate roll, a prize record, a Hall of Fame &mdash;
            and gives every name on it the Cardology card for their calendar date. The card comes
            from the month and day; the year is never used, and nothing here is a forecast.
          </p>
        </div>
        <p className="mt-4 text-xs text-[#5b5148]">
          By{" "}
          <Link href="/about" className="underline underline-offset-4">
            Cassidy Rice
          </Link>{" "}
          &middot; Updated {updatedLabel(UPDATED)} &middot;{" "}
          <Link href="/methodology" className="underline underline-offset-4">
            Calculation method
          </Link>
        </p>
      </header>

      <section className="max-w-3xl space-y-5 font-serif text-lg leading-relaxed text-[#3d352d]">
        <p>
          A birth card is an address on the calendar. Fifty-five minus twice the month minus the
          day gives a number from one to fifty-two, and that number is a card. Two people born on
          the same day of the year share a card whether or not they share anything else, which is
          exactly what makes a directory worth reading: you can see the pattern land on people
          whose lives had nothing to do with each other.
        </p>
        <p>
          Every page in these directories does the same three things. It states the coordinate and
          shows the work. It quotes the person&rsquo;s record verbatim from the Wikipedia article
          it cites. And it sets one line of the card&rsquo;s own published language beside one
          sentence of that record, saying plainly which rule paired the two. Where no sentence
          echoes the card, the page says so instead of inventing a resemblance.
        </p>
        <p>
          None of it is fortune-telling. If you want your own card rather than someone
          else&rsquo;s, the{" "}
          <Link href="/birth-card-calculator" className="underline underline-offset-4">
            birth-card calculator
          </Link>{" "}
          takes a birthday and returns the whole fixed path.
        </p>
      </section>

      {GROUPS.map((group) => (
        <section key={group.heading} className="mt-12 max-w-3xl">
          <h2 className="display text-2xl text-[#14110d] sm:text-3xl">{group.heading}</h2>
          <p className="mt-2 font-serif text-base leading-relaxed text-[#5b5148]">{group.note}</p>
          <ul className="mt-5 space-y-4">
            {group.items.map((item) => (
              <li key={item.href} className="border-t border-[#14110d]/10 pt-4">
                <p>
                  {/* Worker-served, so a plain anchor and not next/link. */}
                  <a
                    href={item.href}
                    className="font-serif text-lg underline decoration-[#14110d]/20 underline-offset-4 transition hover:decoration-[#8e321f]"
                  >
                    {item.label}
                  </a>{" "}
                  <span className="text-sm text-[#8a8078]">
                    {item.pages.toLocaleString("en-US")} pages
                  </span>
                </p>
                <p className="mt-1 font-serif text-base leading-relaxed text-[#3d352d]">
                  {item.blurb}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="mt-14 max-w-3xl">
        <h2 className="display text-2xl text-[#14110d] sm:text-3xl">Questions</h2>
        <dl className="mt-5 space-y-6">
          {faqs.map((faq) => (
            <div key={faq.q} className="border-t border-[#14110d]/10 pt-4">
              <dt className="font-serif text-lg text-[#14110d]">{faq.q}</dt>
              <dd className="mt-2 font-serif text-base leading-relaxed text-[#3d352d]">{faq.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </SeoShell>
  );
}
