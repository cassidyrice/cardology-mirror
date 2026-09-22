import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { CARDOLOGY_LIBRARY, LIBRARY_VERIFIED_ON, type LibraryEntry } from "@/lib/cardology-library";
import { PAGE_UPDATED_DATES } from "@/lib/page-dates";
import { updatedLabel } from "@/lib/page-updated";
import { SITE_NAME } from "@/lib/site";

const UPDATED = PAGE_UPDATED_DATES["/cardology-books"];

const TITLE = "Cardology Books & Decks: Every Title, With Its Catalogue Record";
const DESCRIPTION =
  "The cardology bibliography, 1762 to today — Richmond 1893, Randall & Campbell 1947, Lein 1978, Camp 1992 — each with publisher, year, what it covers, and a link to the Library of Congress, archive.org or Open Library record.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/cardology-books" },
  openGraph: {
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    url: "/cardology-books",
    type: "article",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const GROUPS: { id: string; heading: string; blurb: string; pick: (e: LibraryEntry) => boolean }[] = [
  {
    id: "before",
    heading: "Before cardology (1762)",
    blurb:
      "The deck-as-calendar arithmetic predates the practice by 130 years. Any history that starts in 1893 starts late.",
    pick: (e) => e.kind === "ephemera",
  },
  {
    id: "foundational",
    heading: "The foundational texts (1892–1947)",
    blurb:
      "Three books contain everything later authors rearrange: the solar calendar, the birthday chart, and the Life Spread.",
    pick: (e) => e.kind === "book" && e.year < "1970",
  },
  {
    id: "modern",
    heading: "The modern system (1978–2006)",
    blurb:
      "Where the practice got its popular names — metasymbology, then Destiny Cards — and its yearly-spread machinery.",
    pick: (e) => e.kind === "book" && e.year >= "1970",
  },
  {
    id: "adjacent",
    heading: "Decks and adjacent cartomancy",
    blurb:
      "Shuffled-draw decks are a different practice from birth-card work. They are listed here because they are the titles most often mistaken for it.",
    pick: (e) => e.kind === "deck",
  },
];

function Entry({ entry }: { entry: LibraryEntry }) {
  return (
    <li className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <p className="display text-lg text-brand-ink">
        {entry.title} <span className="text-mist">({entry.year})</span>
      </p>
      <p className="mt-1 text-sm text-mist">
        {entry.author}
        {entry.publisher ? ` · ${entry.publisher}` : ""}
      </p>
      <p className="prose-reading mt-3 text-mist">{entry.covers}</p>
      <p className="mt-3 text-sm">
        <a
          href={entry.source}
          className="text-gold underline underline-offset-4"
          rel="noopener"
          target="_blank"
        >
          Catalogue record: {entry.sourceLabel} →
        </a>
      </p>
    </li>
  );
}

export default function CardologyBooks() {
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Cardology books and decks",
    description: DESCRIPTION,
    numberOfItems: CARDOLOGY_LIBRARY.length,
    itemListElement: CARDOLOGY_LIBRARY.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Book",
        name: entry.title,
        author: { "@type": "Person", name: entry.author },
        datePublished: entry.year,
        ...(entry.publisher ? { publisher: { "@type": "Organization", name: entry.publisher } } : {}),
        sameAs: entry.source,
      },
    })),
  };

  return (
    <SeoShell
      crumb={[
        { label: "Home", href: "/" },
        { label: "Cardology books & decks", href: "/cardology-books" },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />

      <h1 className="display mb-3 text-3xl text-brand-ink">Cardology Books &amp; Decks</h1>

      <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5" data-ai-summary>
        <p className="eyebrow mb-2 text-gold">Direct answer</p>
        <p className="prose-reading text-mist">
          The cardology literature is small: one 1893 source text, one 1947 book that
          turned it into a birthday chart, and a handful of modern treatments that
          rearrange both. {CARDOLOGY_LIBRARY.length} titles are listed below, each with its publisher, year,
          what it actually contains, and a link to its Library of Congress,
          archive.org or Open Library record — so you can check any claim against the
          book rather than against another website.
        </p>
      </div>

      <p className="mb-6 text-sm text-mist">
        Every record here was resolved against a public catalogue on{" "}
        {updatedLabel(LIBRARY_VERIFIED_ON)}. Titles we could not verify are left out
        rather than listed with a guessed year or publisher, and claims that rest on
        one author&rsquo;s own word are marked <em>self-reported</em>. Dates in
        context:{" "}
        <Link href="/what-is-cardology#lineage" className="text-gold underline underline-offset-4">
          the sourced lineage
        </Link>
        .
      </p>

      {GROUPS.map((group) => {
        const entries = CARDOLOGY_LIBRARY.filter(group.pick);
        if (entries.length === 0) return null;
        return (
          <section className="mt-8" key={group.id} id={group.id}>
            <h2 className="eyebrow mb-2 text-gold">{group.heading}</h2>
            <p className="prose-reading mb-4 text-mist">{group.blurb}</p>
            <ul className="space-y-4">
              {entries.map((entry) => (
                <Entry entry={entry} key={entry.title} />
              ))}
            </ul>
          </section>
        );
      })}

      <section className="mt-10" id="corrections">
        <h2 className="eyebrow mb-2 text-gold">Corrections and additions</h2>
        <p className="prose-reading text-mist">
          Missing a title, or holding an edition that contradicts a date here? Send
          the catalogue record and it gets added or fixed — a citation, not a claim.{" "}
          <Link href="/contact" className="text-gold underline underline-offset-4">
            Contact
          </Link>
          . Our own method, including which of these books each step comes from, is on the{" "}
          <Link href="/methodology" className="text-gold underline underline-offset-4">
            methodology page
          </Link>
          .
        </p>
      </section>

      <p className="mt-8 text-xs text-faint">
        By Cassidy Rice · Updated {updatedLabel(UPDATED)} ·{" "}
        <Link href="/editorial-policy" className="text-gold underline underline-offset-4">
          Editorial policy
        </Link>
      </p>
    </SeoShell>
  );
}
