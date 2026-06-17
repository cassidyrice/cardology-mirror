import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Editorial Policy",
  description:
    "How Cardology Pro keeps card calculations clear, meanings useful, and corrections easy to send.",
  alternates: { canonical: "/editorial-policy" },
};

const policies = [
  {
    title: "Calculation before interpretation",
    body: "A birth date maps to a fixed card first. Interpretation begins after the card, suit, rank, and timing layer are clear.",
  },
  {
    title: "Real people, not flat labels",
    body: "A card should help explain behavior, compatibility, timing, and recurring dynamics without pretending to be the whole person.",
  },
  {
    title: "Direct and useful",
    body: "A strong page answers the card question quickly, then gives examples, relationship cues, timing context, and next steps.",
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
            Cardology Pro keeps the math visible and the interpretation practical:
            calculate the card, read the pattern, compare the person, and correct what
            needs correcting.
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
          Blog posts, calculators, card pages, and videos should leave the reader with
          a clearer pattern: what the card means, where it shows up, which people bring
          it out, and what the next useful comparison is.
        </p>
        <p>
          Where a page discusses relationships, work, money, health, or life choices,
          the language should stay concrete: attraction, friction, pressure, support,
          repeating roles, and the choices available inside the pattern.
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
