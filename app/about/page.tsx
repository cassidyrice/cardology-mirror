import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { SITE_NAME, SITE_URL, VIDEO_PATH } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "About Cardology Pro",
  description:
    "Learn what Cardology Pro covers, how it treats Cardology as a deterministic people-and-pattern system, and how it applies cards to real relationship dynamics.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About Cardology Pro",
    url: `${SITE_URL}/about`,
    about: {
      "@type": "Thing",
      name: "Cardology",
      description:
        "A 52-card birth-date system used by Cardology Pro to read people, relationships, timing, and recurring patterns.",
    },
    publisher: { "@id": `${SITE_URL}/#organization` },
  };

  return (
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "About", href: "/about" }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="max-w-3xl pb-8">
        <p className="oracle-eyebrow mb-4">About the reference</p>
        <h1 className="display text-5xl leading-none text-[#14110d] sm:text-6xl">
          Cardology Pro is a public guide to birth cards, meanings, timing, and compatibility.
        </h1>
        <div className="mt-6 border border-[#14110d]/15 bg-[#eadfcd]/70 p-5">
          <p className="oracle-eyebrow mb-2">Quick answer</p>
          <p className="text-base leading-relaxed text-[#3d352d]">
            {SITE_NAME} treats Cardology as a deterministic 52-card birth-date system
            for understanding people, relationship dynamics, timing, and recurring
            patterns. The site explains calculations, card meanings, compatibility,
            famous-person profiles, and real-life use cases in plain language.
          </p>
        </div>
      </header>

      <section className="space-y-5 font-serif text-lg leading-relaxed text-[#3d352d]">
        <p>
          The public site is organized around searchable Cardology questions: what is
          my birth card, what does this card mean, how do two cards compare, and how
          does the 52-card system work?
        </p>
        <p>
          The calculation layer is kept separate from interpretation. The birthday
          mapping is deterministic; the meaning layer is written as pattern language
          for people, relationship dynamics, journaling, timing, compatibility, and
          personal inquiry.
        </p>
        <p>
          Cardology Pro does not present Cardology as medical, legal, financial, or
          psychological advice. It also does not claim that one card explains all of
          a person. The recurring editorial line is simple: apply the card to real
          life, then keep what clarifies.
        </p>
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-2">
        <Link href="/methodology" className="border border-[#14110d]/15 bg-[#eadfcd]/55 p-5 transition hover:bg-[#fffaf0]">
          <p className="font-serif text-2xl text-[#14110d]">Methodology</p>
          <p className="mt-2 text-sm leading-relaxed text-[#5b5148]">
            How the site separates fixed card calculation from interpretation.
          </p>
        </Link>
        <Link href="/editorial-policy" className="border border-[#14110d]/15 bg-[#eadfcd]/55 p-5 transition hover:bg-[#fffaf0]">
          <p className="font-serif text-2xl text-[#14110d]">Editorial policy</p>
          <p className="mt-2 text-sm leading-relaxed text-[#5b5148]">
            How pages are framed, updated, and bounded.
          </p>
        </Link>
        <Link href={VIDEO_PATH} className="border border-[#14110d]/15 bg-[#eadfcd]/55 p-5 transition hover:bg-[#fffaf0]">
          <p className="font-serif text-2xl text-[#14110d]">Videos</p>
          <p className="mt-2 text-sm leading-relaxed text-[#5b5148]">
            Watch the multimedia companion to the written Cardology guide.
          </p>
        </Link>
        <Link href="/contact" className="border border-[#14110d]/15 bg-[#eadfcd]/55 p-5 transition hover:bg-[#fffaf0]">
          <p className="font-serif text-2xl text-[#14110d]">Contact</p>
          <p className="mt-2 text-sm leading-relaxed text-[#5b5148]">
            Send corrections, questions, or partnership requests through the public contact page.
          </p>
        </Link>
      </section>
    </SeoShell>
  );
}
