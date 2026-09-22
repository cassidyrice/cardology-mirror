import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { allTattoos } from "@/lib/tattoos";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { PAGE_UPDATED_DATES } from "@/lib/page-dates";
import { updatedLabel } from "@/lib/page-updated";
import { serializeJsonLdForHtml } from "@/lib/structured-data";

const UPDATED = PAGE_UPDATED_DATES["/playing-card-tattoo-meaning"];
const TITLE = "Playing Card Tattoo Meaning: Pip Patterns for All 52 Cards";
const DESCRIPTION =
  "Playing card tattoos as pip fields only — the exact French-deck layout of each card, on skin, with no border and no index. 52 references, one hub.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/playing-card-tattoo-meaning" },
  openGraph: {
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    url: "/playing-card-tattoo-meaning",
    images: [{ url: "/og/ace-of-spades.png", width: 1200, height: 630, alt: "Ace of Spades playing card" }],
  },
};

const faqs = [
  {
    q: "What does a playing card tattoo mean?",
    a: "A playing-card tattoo is usually read as luck, risk, or identity. On this site it is more specific: the pip field of one card in the 52-card deck, which is also a Cardology birth card for a set of dates. The layout is the card. It is not fortune-telling.",
  },
  {
    q: "Should I tattoo the whole card or just the pips?",
    a: "These references are pip-only: no rectangle, no corner index, no face. Number cards use the exact French-deck pip count and placement. Ace, Jack, Queen, and King use a single suit pip — the face lives on the card, not in the tattoo.",
  },
  {
    q: "How do I know which card to tattoo?",
    a: "If you want the card that maps to your birthday, use the birth card calculator. The same month and day always return the same card. Then open that card's meaning page for the pip reference.",
  },
];

export default function PlayingCardTattooMeaning() {
  const tattoos = allTattoos();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <SeoShell
      crumb={[
        { label: "Home", href: "/" },
        { label: "Birth Cards", href: "/birth-card" },
        { label: "Pip tattoos", href: "/playing-card-tattoo-meaning" },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLdForHtml(jsonLd) }} />

      <span className="type-eyebrow !font-bold !text-brand-ink-soft">52 pip fields</span>
      <h1 className="display mt-1 text-3xl text-brand-ink">Playing card tattoo meaning</h1>
      <p className="mt-3 text-xs text-brand-ink-soft">Updated {updatedLabel(UPDATED)}</p>
      <p className="prose-reading mt-4 text-brand-ink-soft">
        A playing-card tattoo is often a full card, a skull, or a lucky ace. These are none of those.
        Each image is the pip field a real French-suited deck uses for that rank — the same count, the
        same placement, lower pips inverted — photographed as a mark on skin. No border. No index.
        Court cards are one suit pip, because the face is the card, not the tattoo.
      </p>
      <p className="prose-reading mt-3 text-brand-ink-soft">
        They live on the existing birth-card pages, not as 52 extra URLs. This hub is the index.
        Generated references, not client work. If you are inking a birth card,{" "}
        <Link href="/birth-card-calculator" className="text-brand-oxblood underline underline-offset-4">
          find yours first
        </Link>
        .
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tattoos.map((row) => (
          <Link
            key={row.slug}
            href={`/birth-card/${row.slug}`}
            className="group block overflow-hidden rounded-2xl border border-brand-line bg-brand-ivory/70"
          >
            <img
              src={row.image}
              alt={`${row.label} pip tattoo on the ${row.bodyLabel}`}
              width={600}
              height={800}
              loading="lazy"
              decoding="async"
              className="aspect-[3/4] w-full object-cover"
            />
            <div className="p-3">
              <p className="font-serif text-base text-brand-bronze">{row.label}</p>
              <p className="text-xs text-brand-ink-soft">{row.bodyLabel}</p>
            </div>
          </Link>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">Questions</h2>
        <dl className="space-y-4">
          {faqs.map((item) => (
            <div key={item.q}>
              <dt className="font-serif text-base text-brand-ink">{item.q}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-brand-ink-soft">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </SeoShell>
  );
}
