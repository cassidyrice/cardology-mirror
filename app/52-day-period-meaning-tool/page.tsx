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
  "All 52 card meanings, run through the seven Cardology planetary filters: Mercury, Venus, Mars, Jupiter, Saturn, Uranus, and Neptune. Same card, new problem.";

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
        <h1 className="display text-5xl leading-none text-brand-ink sm:text-7xl">
          One card. Seven ways to read the season.
        </h1>
        <p className="mt-5 max-w-3xl font-serif text-xl leading-relaxed text-brand-ink sm:text-2xl">
          Pick any card. Run it through the seven yearly period filters. The card stays the same. The filter changes the context: mind, love, action, growth, discipline, disruption, or surrender. At least one of them is about you.
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-brand-ink-soft sm:text-base">
          This tool is for exploring an interpretation, not obeying one. Read the same card through relationships, action, or another theme. Then hold the words up against your actual life and see what sticks.
        </p>
      </header>

      <section className="app-paper-stage border-y border-brand-line bg-brand-paper-deep">
        <PeriodMeaningTool cards={cards} filters={PERIOD_FILTERS} />
      </section>

      <section className="mt-10 max-w-3xl" id="monthly">
        <h2 className="oracle-eyebrow mb-3">Looking for a monthly card?</h2>
        <p className="text-base leading-relaxed text-brand-ink">
          Your birthday year has seven planetary seasons. Mercury through Uranus each last 52 days. Neptune continues through the day before your next birthday. Calendar months don&rsquo;t care and can cross more than one season. Use the dated boundaries when reading a particular month.
        </p>
        <p className="mt-3 text-base leading-relaxed text-brand-ink">
          To place any month: count 52-day blocks forward from your last birthday.
          The{" "}
          <Link href="/timing" className="underline underline-offset-4">
            yearly spread tool
          </Link>{" "}
          does the counting and names the period you are in today. You don&rsquo;t
          have to do math. The filters above then show how your card reads inside it.
        </p>
      </section>

      <section className="mt-10 max-w-3xl">
        <h2 className="oracle-eyebrow mb-3">Where to go next</h2>
        <p className="text-base leading-relaxed text-brand-ink">
          A period card is only one layer. Don&rsquo;t build a whole personality on it.
          Read the card on its own on its{" "}
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
        <p className="mt-3 text-base leading-relaxed text-brand-ink">
          To see where the seven periods actually come from, the board your card
          moves across each year, read{" "}
          <Link href="/playing-card-spreads" className="underline underline-offset-4">
            playing card spreads
          </Link>
          .
        </p>
        <p className="mt-3 text-sm leading-relaxed text-brand-ink-soft">
          Would rather have a human read your cards than look them up by hand at 1am?
          That is the{" "}
          <Link href="/#readings" className="underline underline-offset-4">
            Personal readings
          </Link>
          .
        </p>
      </section>

    </SeoShell>
  );
}
