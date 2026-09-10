import type { Metadata } from "next";
import Link from "next/link";
import { SeoShell } from "@/components/seo/SeoShell";
import { PeriodMeaningTool } from "@/components/seo/PeriodMeaningTool";
import { allPeriodCardSeeds } from "@/lib/period-card-seeds";
import { PERIOD_FILTERS } from "@/lib/period-meanings";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const canonicalPath = "/52-day-period-meaning-tool";
const title = "52-Day Period Meaning Tool";
const description =
  "Explore all 52 card meanings through the seven Cardology 52-day period filters: Mercury, Venus, Mars, Jupiter, Saturn, Uranus, and Neptune.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: canonicalPath },
  openGraph: {
    siteName: SITE_NAME,
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
  const cards = allPeriodCardSeeds();

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
        <PeriodMeaningTool cards={cards} filters={PERIOD_FILTERS} />
      </section>

      <section className="mt-10 max-w-3xl">
        <h2 className="oracle-eyebrow mb-3">Where to go next</h2>
        <p className="text-base leading-relaxed text-[#3d352d]">
          A period card is only one layer. Read the card on its own on its{" "}
          <Link href="/birth-card" className="underline underline-offset-4">
            card meaning page
          </Link>
          , find which card is yours with the{" "}
          <Link href="/birth-card-calculator" className="underline underline-offset-4">
            birth card calculator
          </Link>
          , or see how the layers fit together in{" "}
          <Link href="/what-is-cardology" className="underline underline-offset-4">
            what Cardology is
          </Link>
          .
        </p>
        <p className="mt-3 text-base leading-relaxed text-[#3d352d]">
          To see where the seven periods actually come from — the board your card
          moves across each year — read{" "}
          <Link href="/playing-card-spreads" className="underline underline-offset-4">
            playing card spreads
          </Link>
          .
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[#5b5148]">
          Want your own seven chapters, dated, instead of looking them up by hand?
          That is the{" "}
          <Link href="/products/52xseven-blueprint" className="underline underline-offset-4">
            52xSeven Blueprint
          </Link>
          .
        </p>
      </section>

    </SeoShell>
  );
}
