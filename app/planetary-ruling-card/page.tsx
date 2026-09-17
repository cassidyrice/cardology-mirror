import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { BirthCardCalculator } from "@/components/seo/BirthCardCalculator";
import { PlanetaryRulingCardChart } from "@/components/seo/PlanetaryRulingCardChart";
import { buildRulingCardReference } from "@/lib/ruling-card-reference";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { PAGE_UPDATED_DATES } from "@/lib/page-dates";
import { updatedLabel } from "@/lib/page-updated";
import { serializeJsonLdForHtml } from "@/lib/structured-data";

export const dynamic = "force-static";
const UPDATED = PAGE_UPDATED_DATES["/planetary-ruling-card"];
const TITLE = "Planetary Ruling Card Chart: Find Yours by Birthday";
const DESCRIPTION = "Find your planetary ruling card by birthday. Search all 366 dates, see every ruling card, compare birth cards, and download the free Cardology chart.";
const CSV_PATH = "/data/planetary-ruling-card-chart.csv";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/planetary-ruling-card" },
  openGraph: {
    siteName: SITE_NAME, title: TITLE, description: DESCRIPTION,
    url: "/planetary-ruling-card", type: "article",
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Card Blueprints" }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: ["/og/default.png"] },
};

const faqs = [
  { q: "What is a planetary ruling card?", a: "A planetary ruling card, or PRC, is a playing card read alongside your birth card in Cardology. The birth card describes the main pattern; the ruling card adds another way to read its expression. Card Blueprints looks up the complete ruling-card result from your month and day." },
  { q: "How do I find my planetary ruling card?", a: "Find your month and day in the chart on this page. The middle column shows your birth card and the last column shows every ruling card assigned to that birthday. You can also use the free calculator below the chart. No account or email is needed." },
  { q: "Can you have two ruling cards?", a: "Yes, and some dates have three. The Card Blueprints table has 45 birthdays with two ruling cards and two birthdays with three: October 23 and October 24. These are entries in our date table, not a claim that every multiple-card birthday is a zodiac cusp." },
  { q: "Can my birth card and planetary ruling card be the same?", a: "Yes. For example, August 20 has the 6 of Clubs as both its birth card and ruling card in this table. They describe two roles in the reading even when the card matches." },
  { q: "Do I need my birth year, birth time, or birthplace?", a: "Not for this chart. Both the birth-card and ruling-card lookups on Card Blueprints use month and day. The calculator asks for a full date because it also shows age-based timing. It does not use your birth time or birthplace to choose a ruling card." },
  { q: "What are the ruling cards for February 29 and December 31?", a: "February 29 has the 9 of Clubs birth card and the 2 of Diamonds ruling card. December 31 is the Joker exception: our table returns Joker in both fields. Joker is not one of the ordinary 52 cards, so read its separate explanation." },
  { q: "Is a planetary ruling card the same as a ruling planet?", a: "No. A ruling planet is an astrology label such as Venus or Saturn. A planetary ruling card is a playing card. In Cardology, planetary rulership is part of the tradition behind the card assignment; this tool uses the site's saved birthday table rather than calculating an astrological chart." },
  { q: "Why might another ruling-card chart give a different answer?", a: "Compare the method and the full list of cards. This chart publishes the same date table used by the Card Blueprints calculator, including multiple-card dates and the Joker exception. It is a reference for this site's convention, not a claim that every Cardology source uses identical rules. The CSV lets you check each result." },
];

const linkClass = "text-brand-oxblood underline underline-offset-4 hover:decoration-2";
const bodyClass = "mt-4 text-base leading-relaxed text-brand-ink-soft";

export default function PlanetaryRulingCard() {
  const rows = buildRulingCardReference();
  const examples = [[1, 15], [2, 13], [8, 20], [10, 23]].map(([month, day]) => rows.find((r) => r.month === month && r.day === day)!);
  const jsonLd = [
    { "@context": "https://schema.org", "@type": "Article", headline: TITLE, description: DESCRIPTION, author: { "@type": "Person", name: "Cassidy Rice" }, publisher: { "@id": `${SITE_URL}/#organization` }, dateModified: UPDATED, mainEntityOfPage: `${SITE_URL}/planetary-ruling-card` },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
    {
      "@context": "https://schema.org", "@type": "Dataset",
      name: "Card Blueprints Planetary Ruling Card Chart: 366 Birthdays",
      description: "The Card Blueprints month-and-day lookup for birth cards and all planetary ruling cards, including multiple-card dates, February 29, and the December 31 Joker exception.",
      url: `${SITE_URL}/planetary-ruling-card#ruling-card-chart`,
      creator: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
      dateModified: UPDATED, version: UPDATED, isAccessibleForFree: true,
      variableMeasured: ["Birthday", "Birth card", "Primary ruling card", "Secondary ruling card", "Third ruling card"],
      distribution: { "@type": "DataDownload", encodingFormat: "text/csv", contentUrl: `${SITE_URL}${CSV_PATH}` },
    },
  ];

  return (
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "Planetary Ruling Card", href: "/planetary-ruling-card" }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLdForHtml(jsonLd) }} />
      <header className="max-w-3xl pb-8">
        <p className="oracle-eyebrow mb-4">The birthday reference</p>
        <h1 className="display text-4xl leading-none text-brand-ink sm:text-6xl">Planetary Ruling Card Chart</h1>
        <p className="mt-5 text-lg leading-relaxed text-brand-ink-soft" data-ai-summary>
          Your birth card is one part of the reading. Your <strong className="text-brand-ink">planetary ruling card</strong>, or PRC, adds another layer.
          Find your birthday below to see both, including every ruling card when your date has more than one.
        </p>
        <p className="mt-4 text-xs leading-relaxed text-brand-ink-soft">By Cassidy Rice · Updated {updatedLabel(UPDATED)} · <Link href="/editorial-policy" className="underline underline-offset-4">Editorial policy</Link></p>
        <nav aria-label="On this page" className="mt-6 flex flex-wrap gap-3 text-sm">
          <a href="#ruling-card-chart" className="inline-flex min-h-12 items-center bg-brand-oxblood px-5 py-3 font-semibold text-white hover:bg-brand-ink">Find my ruling card</a>
          <a href="#lookup-method" className="inline-flex min-h-12 items-center border border-brand-line-strong px-4 py-3">How the chart works</a>
          <a href="#calculator" className="inline-flex min-h-12 items-center px-3 py-3 underline underline-offset-4">Use the calculator</a>
        </nav>
      </header>

      <section id="ruling-card-chart" className="scroll-mt-8 border-t border-brand-line pt-8">
        <p className="oracle-eyebrow mb-3">366 birthdays · complete results · free</p>
        <h2 className="font-serif text-3xl leading-tight sm:text-4xl">Find your planetary ruling card by birthday</h2>
        <p className={bodyClass}>Open your birth month. Read across from your birthday to your birth card and ruling card(s). Each card name opens its meaning. The chart includes February 29 and the December 31 Joker exception.</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
          <a href={CSV_PATH} download className={`${linkClass} inline-flex min-h-11 items-center`}>Download all 366 birthdays (CSV)</a>
          <a href="#multiple-ruling-cards" className={`${linkClass} inline-flex min-h-11 items-center`}>Why does my date have more than one?</a>
        </div>
        <PlanetaryRulingCardChart rows={rows} />
        <p className="mt-4 text-xs leading-relaxed text-brand-ink-soft">Reference: the Card Blueprints birthday table, shared with our calculator. Reviewed {updatedLabel(UPDATED)}. Month and day are enough for this lookup.</p>
      </section>

      <section id="lookup-method" className="mt-12 scroll-mt-8 border-t border-brand-line pt-8">
        <p className="oracle-eyebrow mb-3">Check the method</p>
        <h2 className="font-serif text-3xl">How the ruling-card lookup works</h2>
        <p className={bodyClass}>In the Cardology tradition, ruling cards connect a birthday with planetary rulership. On this site, the actual lookup is straightforward: your month and day select a saved entry. That entry may contain one, two, or three cards. We display the full entry.</p>
        <ol className="mt-5 list-decimal space-y-3 pl-5 text-base leading-relaxed text-brand-ink-soft">
          <li><strong className="text-brand-ink">Find the birthday.</strong> January 15 selects the entry for month 1, day 15.</li>
          <li><strong className="text-brand-ink">Read both fields.</strong> The birth card is the Queen of Diamonds. The ruling-card entry is the 7 of Clubs.</li>
          <li><strong className="text-brand-ink">Check the result.</strong> Find January 15 in the chart or CSV, then enter that birthday in the calculator. All three use the same lookup.</li>
        </ol>
        <p className={bodyClass}>The <Link href="/methodology#birth-card-formula" className={linkClass}>birth-card formula</Link> calculates the birth card. It does not, by itself, calculate the ruling card. This chart does not recalculate zodiac boundaries from your birth year, time, or location.</p>
        <p className={bodyClass}>The lookup tells you which cards the site assigns. Their personality meanings are Cardology interpretations, not evidence that a card causes your behavior. The <Link href="/methodology" className={linkClass}>methodology page</Link> explains that distinction.</p>
      </section>

      <section className="mt-12 border-t border-brand-line pt-8" aria-labelledby="examples-heading">
        <p className="oracle-eyebrow mb-3">Read across the chart</p>
        <h2 id="examples-heading" className="font-serif text-3xl">Same birth card, different ruling card</h2>
        <p className={bodyClass}>January 15 and February 13 share the Queen of Diamonds birth card. Their ruling cards differ. That is why a ruling-card lookup needs the birthday, even when you already know your birth card.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {examples.map((row) => (
            <div key={row.id} className="border border-brand-line bg-brand-ivory p-5">
              <h3 className="font-serif text-2xl"><a href={`#${row.id}`} className="underline decoration-brand-line-strong underline-offset-4">{row.dateLabel}</a></h3>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-brand-ink-soft">Birth card</p>
              <Link href={row.birthCard.href} className={`${linkClass} mt-1 inline-block`}>{row.birthCard.label}</Link>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-brand-ink-soft">Ruling card{row.rulingCards.length > 1 ? "s" : ""}</p>
              <ul className="mt-1 space-y-2">{row.rulingCards.map((card) => <li key={card.code}><Link href={card.href} className={linkClass}>{card.label}</Link></li>)}</ul>
            </div>
          ))}
        </div>
        <p className={bodyClass}>August 20 shows another possibility: the birth and ruling cards match. October 23 shows a three-card result. Neither is a reason to discard part of the lookup. For the meaning of each role, read <Link href="/birth-card-vs-ruling-card" className={linkClass}>birth card vs ruling card</Link>.</p>
      </section>

      <section id="multiple-ruling-cards" className="mt-12 scroll-mt-8 border-t border-brand-line pt-8">
        <h2 className="font-serif text-3xl">Two ruling cards, three cards, and special birthdays</h2>
        <p className={bodyClass}>Our table contains 45 birthdays with two ruling cards and two with three. October 23 and October 24 are the three-card dates. We preserve all of them in the chart and download.</p>
        <p className={bodyClass}>Multiple results do not automatically mean a zodiac cusp. November 6, for example, returns the 3 of Clubs and Queen of Spades. Use the complete date entry rather than assuming a rule from a sign boundary.</p>
        <dl className="mt-5 space-y-4 border-l-2 border-brand-oxblood pl-5 text-base leading-relaxed">
          <div><dt className="font-semibold">February 29</dt><dd className="mt-1 text-brand-ink-soft">The birth card is the 9 of Clubs; the ruling card is the 2 of Diamonds. Leap day has its own row.</dd></div>
          <div><dt className="font-semibold">December 31</dt><dd className="mt-1 text-brand-ink-soft">The site uses Joker in both fields for this exception. It is outside the ordinary 52-card set. Read the <Link href="/birth-card/joker" className={linkClass}>Joker explanation</Link> for that distinction.</dd></div>
        </dl>
      </section>

      <section id="calculator" className="mt-12 scroll-mt-8 border-t border-brand-line pt-8">
        <h2 className="font-serif text-3xl">Planetary ruling card calculator</h2>
        <p className={`${bodyClass} mb-5`}>Prefer to enter a birthday? This free calculator shows your birth card and complete ruling-card result. It asks for a full date because it also includes your current timing. No signup or email.</p>
        <BirthCardCalculator />
      </section>

      <section className="mt-12 border-t border-brand-line pt-8" id="faq">
        <h2 className="font-serif text-3xl">Planetary ruling card FAQ</h2>
        <div className="mt-6 space-y-6">{faqs.map((f) => <div key={f.q}><h3 className="font-serif text-xl text-brand-ink">{f.q}</h3><p className="mt-2 text-base leading-relaxed text-brand-ink-soft">{f.a}</p></div>)}</div>
      </section>

      <aside className="my-12 border border-brand-line bg-brand-paper-deep p-6">
        <h2 className="font-serif text-2xl">Put the cards together</h2>
        <p className="mt-3 text-base leading-relaxed text-brand-ink-soft">Read the meaning of each card, then explore what changes when two people bring their cards into a relationship.</p>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-sm">
          <Link href="/birth-card" className={linkClass}>All 52 card meanings</Link>
          <Link href="/cardology-compatibility" className={linkClass}>Cardology compatibility</Link>
          <Link href="/products/one-question-reading" className={linkClass}>See a One Question Reading</Link>
        </div>
      </aside>
    </SeoShell>
  );
}
