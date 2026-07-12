import type { Metadata } from "next";
import { SeoShell } from "@/components/seo/SeoShell";
import { PeriodMeaningTool } from "@/components/seo/PeriodMeaningTool";
import { ReadingBridge } from "@/components/seo/ReadingBridge";
import { allCardPeriodMeanings } from "@/lib/period-meanings";
import { SITE_URL } from "@/lib/site";

const canonicalPath = "/52-day-period-meaning-tool";
const title = "52-Day Period Meaning Tool";
const description =
  "Explore all 52 card meanings through the seven Cardology 52-day period filters: Mercury, Venus, Mars, Jupiter, Saturn, Uranus, and Neptune.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: canonicalPath },
  openGraph: {
    title,
    description,
    url: canonicalPath,
    type: "website",
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Card Blueprints" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og/default.png"],
  },
};

export default function PeriodMeaningToolPage() {
  const cards = allCardPeriodMeanings();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: title,
    description,
    url: `${SITE_URL}${canonicalPath}`,
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <SeoShell
      crumb={[
        { label: "Home", href: "/" },
        { label: "52-Day Period Meaning Tool", href: canonicalPath },
      ]}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="max-w-4xl pb-8">
        <p className="oracle-eyebrow mb-4">card meaning × period filter</p>
        <h1 className="display text-5xl leading-none text-[#14110d] sm:text-7xl">
          Every card meaning, through each 52-day lens.
        </h1>
        <p className="mt-5 max-w-3xl font-serif text-xl leading-relaxed text-[#3d352d] sm:text-2xl">
          Pick any card and run it through the seven yearly period filters. The card stays the same; the filter changes the context: mind, love, action, growth, discipline, disruption, or surrender.
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#5b5148] sm:text-base">
          This tool is a structured mirror, not a forecast. It gives a reusable language layer for reading the same card differently depending on which 52-day chapter is active.
        </p>
      </header>

      <section className="app-paper-stage border-y border-[#14110d]/15 bg-[#eadfcd]/55">
        <PeriodMeaningTool cards={cards} />
      </section>

      <ReadingBridge variant="timing" className="mt-12" />
    </SeoShell>
  );
}
