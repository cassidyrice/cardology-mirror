import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Cardology Shadow and Karma Guide",
  description:
    "Plain-English Cardology guide to shadow, alignment, support karma, challenge karma, environment cards, and displacement cards.",
  alternates: { canonical: "/shadow-karma-guide" },
};

const glossary = [
  ["Shadow", "A protective pattern that once helped but now costs clarity, connection, or proportion."],
  ["Alignment", "The centered expression of a card: the useful middle lane between under-expression and over-expression."],
  ["Support karma", "A card relationship that can feel like a gift, resource, or familiar strength when handled cleanly."],
  ["Challenge karma", "A card relationship that can surface pressure, repetition, or a lesson asking for maturity."],
  ["Environment card", "A Life Spread connection often read as an available gift or supportive atmosphere."],
  ["Displacement card", "A Life Spread connection often read as a challenge, friction point, or integration task."],
];

const faqs = [
  {
    q: "Is shadow work in Cardology a prediction?",
    a: "Shadow language names where a card pattern gets distorted in real behavior, relationships, choices, and timing.",
  },
  {
    q: "Are challenge karma cards bad?",
    a: "No. A challenge card names friction or repetition. It can become useful when the pattern is handled with awareness and proportion.",
  },
  {
    q: "What is the difference between support karma and challenge karma?",
    a: "Support karma tends to feel like an accessible gift or familiar resource. Challenge karma tends to reveal where a person must mature the way they use a card pattern.",
  },
];

export default function ShadowKarmaGuidePage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Cardology Shadow and Karma Guide",
      description: metadata.description,
      url: `${SITE_URL}/shadow-karma-guide`,
      publisher: { "@id": `${SITE_URL}/#organization` },
      mainEntityOfPage: `${SITE_URL}/shadow-karma-guide`,
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
        { label: "Shadow & Karma Guide", href: "/shadow-karma-guide" },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="max-w-3xl pb-8">
        <p className="oracle-eyebrow mb-4">Cardology meanings</p>
        <h1 className="display text-5xl leading-none text-[#14110d] sm:text-6xl">
          Shadow, alignment, support karma, and challenge karma in Cardology.
        </h1>
        <div className="mt-6 border border-[#14110d]/15 bg-[#eadfcd]/70 p-5">
          <p className="oracle-eyebrow mb-2">Quick answer</p>
          <p className="text-base leading-relaxed text-[#3d352d]">
            In Cardology, shadow describes a card pattern when it slips out of
            proportion. Alignment is the centered expression. Support karma and
            challenge karma describe card relationships that can feel like gifts,
            pressure, repetition, or lessons to integrate.
          </p>
        </div>
      </header>

      <section className="space-y-5 font-serif text-lg leading-relaxed text-[#3d352d]">
        <p>
          Shadow language is useful only when it stays practical. It should help a
          person notice where a gift becomes too loud, too quiet, too controlling, or
          too evasive. It should not become a label that freezes someone in place.
        </p>
        <p>
          Karma language works the same way. A support card is not automatic rescue;
          a challenge card is not punishment. Both are symbolic relationships inside
          the spread that can make a pattern easier to see.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="oracle-eyebrow mb-4">Glossary</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          {glossary.map(([term, definition]) => (
            <div key={term} className="border border-[#14110d]/15 bg-[#f4f0e7]/78 p-5">
              <dt className="font-serif text-2xl text-[#14110d]">{term}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-[#5b5148]">{definition}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-4xl leading-none text-[#14110d]">Frequently asked questions</h2>
        <div className="mt-5 space-y-4">
          {faqs.map((faq) => (
            <div key={faq.q} className="border-t border-[#14110d]/15 pt-4">
              <h3 className="font-serif text-2xl text-[#14110d]">{faq.q}</h3>
              <p className="mt-2 text-base leading-relaxed text-[#5b5148]">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-3">
        <Link href="/birth-card" className="border border-[#14110d]/15 bg-[#eadfcd]/55 p-4 text-sm font-bold uppercase text-[#14110d] transition hover:bg-[#fffaf0]">
          All 52 card meanings
        </Link>
        <Link href="/birth-card-vs-ruling-card" className="border border-[#14110d]/15 bg-[#eadfcd]/55 p-4 text-sm font-bold uppercase text-[#14110d] transition hover:bg-[#fffaf0]">
          Birth card vs ruling card
        </Link>
        <Link href="/cardology-compatibility" className="border border-[#14110d]/15 bg-[#eadfcd]/55 p-4 text-sm font-bold uppercase text-[#14110d] transition hover:bg-[#fffaf0]">
          Compatibility guide
        </Link>
      </section>
    </SeoShell>
  );
}
