import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Cardology Methodology",
  description:
    "How Cardology Pro explains deterministic birth-card calculation, 52-card structure, ruling cards, timing language, and interpretation limits.",
  alternates: { canonical: "/methodology" },
};

const principles = [
  ["52 cards", "The deck is treated as a calendar-like structure with one card for each week of the year."],
  ["4 suits", "Hearts, Diamonds, Clubs, and Spades describe domains of life: feeling, value, mind, and work."],
  ["13 ranks", "Aces through Kings describe movement inside a suit, from initiation through mastery."],
  ["Fixed birthday map", "A birth card is calculated from the birthday. It is not chosen by a quiz or random draw."],
];

export default function MethodologyPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: "Cardology Pro Methodology",
    description: metadata.description,
    url: `${SITE_URL}/methodology`,
    publisher: { "@id": `${SITE_URL}/#organization` },
    mainEntityOfPage: `${SITE_URL}/methodology`,
  };

  return (
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "Methodology", href: "/methodology" }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="max-w-3xl pb-8">
        <p className="oracle-eyebrow mb-4">Calculation and interpretation</p>
        <h1 className="display text-5xl leading-none text-[#14110d] sm:text-6xl">
          How Cardology Pro calculates cards and frames meaning.
        </h1>
        <div className="mt-6 border border-[#14110d]/15 bg-[#eadfcd]/70 p-5">
          <p className="oracle-eyebrow mb-2">Quick answer</p>
          <p className="text-base leading-relaxed text-[#3d352d]">
            Cardology Pro uses deterministic birthday-to-card calculation and then
            explains the result with symbolic interpretation. The calculation is fixed;
            the reading is a reflection framework, not a prediction.
          </p>
        </div>
      </header>

      <section>
        <h2 className="oracle-eyebrow mb-4">Core structure</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {principles.map(([label, detail]) => (
            <div key={label} className="border border-[#14110d]/15 bg-[#f4f0e7]/78 p-5">
              <p className="font-serif text-2xl text-[#14110d]">{label}</p>
              <p className="mt-2 text-sm leading-relaxed text-[#5b5148]">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 space-y-5 font-serif text-lg leading-relaxed text-[#3d352d]">
        <p>
          A Cardology page should answer the calculation question first: which card,
          which birthday, which suit, and which rank. Interpretation comes after that,
          using the card as a range of expressions: balanced, under-expressed, and
          over-expressed.
        </p>
        <p>
          Ruling-card and timing pages add context, but they do not change the site&rsquo;s
          boundary. A period card can frame a chapter of time; it should not be used
          as certainty about what will happen.
        </p>
        <p>
          This is why Cardology Pro repeatedly links calculators, card meaning pages,
          blog guides, and videos together. The goal is a clear educational map, not
          a hidden or mystical claim.
        </p>
      </section>

      <section className="mt-12 border border-[#14110d]/15 bg-[#eadfcd]/55 p-5">
        <h2 className="font-serif text-3xl text-[#14110d]">Use the method</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/birth-card-calculator" className="rounded-full border border-[#14110d]/18 px-4 py-2 text-xs font-bold uppercase text-[#9e3d24]">
            Birth Card Calculator
          </Link>
          <Link href="/birth-card" className="rounded-full border border-[#14110d]/18 px-4 py-2 text-xs font-bold uppercase text-[#9e3d24]">
            All 52 Birth Cards
          </Link>
          <Link href="/52-card-astrology-explained" className="rounded-full border border-[#14110d]/18 px-4 py-2 text-xs font-bold uppercase text-[#9e3d24]">
            52-Card Astrology Explained
          </Link>
        </div>
      </section>
    </SeoShell>
  );
}
