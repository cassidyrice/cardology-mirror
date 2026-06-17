import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Editorial Policy",
  description:
    "How Cardology Pro writes, updates, and bounds its educational Cardology content for calculators, card meanings, blog guides, and videos.",
  alternates: { canonical: "/editorial-policy" },
};

const policies = [
  {
    title: "Calculation before interpretation",
    body: "Pages separate fixed birthday-to-card outputs from symbolic interpretation, so readers can see what is calculated and what is editorial explanation.",
  },
  {
    title: "Real people, not flat labels",
    body: "Cardology Pro applies card meanings to people, compatibility, timing, and recurring dynamics without reducing a person to one card or replacing professional advice.",
  },
  {
    title: "Searchable and answer-first",
    body: "Important pages are written to answer the core question near the top before expanding into examples, FAQs, links, and related tools.",
  },
  {
    title: "Corrections and updates",
    body: "Pages may be revised when terminology, internal linking, schema, or calculation explanations need clarification.",
  },
];

export default function EditorialPolicyPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Cardology Pro Editorial Policy",
    url: `${SITE_URL}/editorial-policy`,
    publisher: { "@id": `${SITE_URL}/#organization` },
    about: "Editorial policy for educational Cardology content.",
  };

  return (
    <SeoShell
      crumb={[
        { label: "Home", href: "/" },
        { label: "Editorial Policy", href: "/editorial-policy" },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="max-w-3xl pb-8">
        <p className="oracle-eyebrow mb-4">Trust and boundaries</p>
        <h1 className="display text-5xl leading-none text-[#14110d] sm:text-6xl">
          Editorial policy for Cardology Pro.
        </h1>
        <div className="mt-6 border border-[#14110d]/15 bg-[#eadfcd]/70 p-5">
          <p className="oracle-eyebrow mb-2">Quick answer</p>
          <p className="text-base leading-relaxed text-[#3d352d]">
            Cardology Pro publishes educational Cardology pages that explain fixed
            calculations, card meanings, relationship patterns, timing, and practical
            examples. The content can name dynamics directly, but it should not replace
            professional guidance.
          </p>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        {policies.map((policy) => (
          <article key={policy.title} className="border border-[#14110d]/15 bg-[#f4f0e7]/78 p-5">
            <h2 className="font-serif text-2xl leading-none text-[#14110d]">{policy.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#5b5148]">{policy.body}</p>
          </article>
        ))}
      </section>

      <section className="mt-10 space-y-5 font-serif text-lg leading-relaxed text-[#3d352d]">
        <p>
          Blog posts, calculators, card pages, and video hubs are written to be useful
          to people first and readable by search systems second. Direct answers,
          glossary language, FAQ sections, and internal links are used to reduce
          ambiguity.
        </p>
        <p>
          Where a page discusses relationships, work, money, health, or life choices,
          it is framed as pattern language for real people and real dynamics. Cardology
          Pro can name attraction, friction, pressure, support, and repeating roles; it
          does not give medical, legal, financial, psychological, or relationship directives.
        </p>
      </section>

      <p className="mt-10">
        <Link href="/contact" className="ink-button large-button inline-flex">
          Contact Cardology Pro
        </Link>
      </p>
    </SeoShell>
  );
}
