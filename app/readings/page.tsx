import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { READING_OFFERS, readingOfferHref } from "@/lib/products";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Cardology Readings and Reports",
  description:
    "Cardology Pro reading options: $29 basic birth card report, $99 one-question personal reading, and $199 full deep dive reading.",
  alternates: { canonical: "/readings" },
  openGraph: {
    title: "Cardology Readings and Reports",
    description:
      "Choose a Cardology Pro report or personal reading: basic birth card report, one-question reading, or full deep dive.",
    url: "/readings",
    type: "website",
  },
};

export default function ReadingsPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Cardology Readings and Reports",
      description: metadata.description,
      url: `${SITE_URL}/readings`,
      publisher: { "@id": `${SITE_URL}/#organization` },
      mainEntity: {
        "@type": "ItemList",
        itemListElement: READING_OFFERS.map((offer, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: offer.name,
          url: `${SITE_URL}/readings#${offer.slug}`,
        })),
      },
    },
    ...READING_OFFERS.map((offer) => ({
      "@context": "https://schema.org",
      "@type": "Product",
      name: offer.name,
      description: offer.oneLine,
      category: "Cardology reading",
      brand: { "@id": `${SITE_URL}/#organization` },
      url: `${SITE_URL}/readings#${offer.slug}`,
      offers: {
        "@type": "Offer",
        price: offer.price,
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        url: `${SITE_URL}${readingOfferHref(offer)}`,
      },
    })),
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Which Cardology reading should I start with?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Start with the $29 basic birth card report if you want the core structure. Choose the $99 one-question reading for one focused situation. Choose the $199 deep dive for the fullest personal map.",
          },
        },
        {
          "@type": "Question",
          name: "Are Cardology readings predictions?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. Cardology Pro frames readings as symbolic pattern language and reflection, not as prediction, diagnosis, legal advice, medical advice, financial advice, or certainty about fate.",
          },
        },
        {
          "@type": "Question",
          name: "What details are needed for a reading?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "A reading needs a birth date. The one-question and deep dive readings also need the client question or area of focus.",
          },
        },
      ],
    },
  ];

  return (
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "Readings", href: "/readings" }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="max-w-3xl pb-8">
        <p className="oracle-eyebrow mb-4">Personal Cardology readings</p>
        <h1 className="display text-5xl leading-none text-[#14110d] sm:text-6xl">
          Choose the amount of mirror you actually need.
        </h1>
        <p className="mt-5 max-w-2xl font-serif text-xl leading-relaxed text-[#3d352d] sm:text-2xl">
          Cardology Pro has one clear product ladder: a $29 basic birth card report,
          a $99 one-question reading, and a $199 full deep dive.
        </p>
        <div className="mt-6 border border-[#14110d]/15 bg-[#eadfcd]/70 p-5" data-ai-summary>
          <p className="oracle-eyebrow mb-2">Quick answer</p>
          <p className="text-base leading-relaxed text-[#3d352d]">
            Start with the $29 report for your core birth-card structure. Move to
            the $99 reading when you have one specific question. Choose the $199
            deep dive when you want the fullest personal Cardology map.
          </p>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        {READING_OFFERS.map((offer) => (
          <article
            id={offer.slug}
            key={offer.slug}
            className="flex flex-col border border-[#14110d]/15 bg-[#f4f0e7]/78 p-5"
          >
            <p className="oracle-eyebrow text-[#9e3d24]">{offer.priceLabel}</p>
            <h2 className="mt-3 font-serif text-3xl leading-none text-[#14110d]">
              {offer.name}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[#5b5148]">{offer.oneLine}</p>
            <dl className="mt-5 space-y-4 text-sm leading-relaxed text-[#5b5148]">
              <div>
                <dt className="font-bold uppercase text-[#14110d]">Best for</dt>
                <dd>{offer.bestFor}</dd>
              </div>
              <div>
                <dt className="font-bold uppercase text-[#14110d]">Deliverable</dt>
                <dd>{offer.deliverable}</dd>
              </div>
              <div>
                <dt className="font-bold uppercase text-[#14110d]">Turnaround</dt>
                <dd>{offer.turnaround}</dd>
              </div>
            </dl>
            <ul className="mt-5 space-y-2 text-sm leading-relaxed text-[#3d352d]">
              {offer.includes.map((item) => (
                <li key={item} className="border-t border-[#14110d]/12 pt-2">
                  {item}
                </li>
              ))}
            </ul>
            <Link href={readingOfferHref(offer)} className="paper-button large-button mt-6 text-center">
              {offer.cta}
            </Link>
          </article>
        ))}
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="border border-[#14110d]/15 bg-[#eadfcd]/55 p-5">
          <h2 className="font-serif text-3xl text-[#14110d]">What every reading will and will not do</h2>
          <p className="mt-4 text-base leading-relaxed text-[#5b5148]">
            A Cardology Pro reading uses the deterministic birth-card system, then
            turns it into useful language for self-reflection. It can name a pattern,
            question, pressure point, or timing frame. It does not promise an event,
            diagnose a person, or replace professional advice.
          </p>
        </div>
        <div className="border border-[#14110d]/15 bg-[#14110d] p-5 text-[#f4f0e7]">
          <h2 className="font-serif text-3xl">Start with the calculator if you are unsure.</h2>
          <p className="mt-4 text-base leading-relaxed text-[#d7cdbc]">
            If you do not know your card yet, calculate it first. The report and
            readings become stronger when you can already name the birth card and
            ruling-card layer.
          </p>
          <Link href="/birth-card-calculator" className="mt-5 inline-block text-[#d9b26a] underline underline-offset-4">
            Open the Birth Card Calculator →
          </Link>
        </div>
      </section>
    </SeoShell>
  );
}
