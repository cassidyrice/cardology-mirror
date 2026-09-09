import type { Metadata } from "next";
import Link from "next/link";

import { LandingCalculator } from "@/components/seo/LandingCalculator";
import { YearPreviewApp } from "@/components/year/YearPreviewApp";
import { DEEP_DIVE_PRICE_LABEL, DEEP_DIVE_PRODUCT_PATH } from "@/lib/deep-dive";
import { buildYearBlueprint } from "@/lib/year-blueprint";
import { SiteFooter } from "@/components/seo/SiteFooter";
import { SiteHeader } from "@/components/seo/SiteHeader";

import "./landing.css";

const HOME_TITLE = "Find Your Birth Card | Card Blueprints";
const HOME_DESCRIPTION =
  "Your birthday adds up to one card. Same date, same card, every time. Type it in and see yours.";

export const metadata: Metadata = {
  title: { absolute: HOME_TITLE },
  description: HOME_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: "/",
    images: [
      {
        url: "/og/default.png",
        width: 1200,
        height: 630,
        alt: "Card Blueprints — your birth card as a mirror",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: ["/og/default.png"],
  },
};

/** Today's card rotates daily; revalidate so HTML stays fresh for crawlers.
 *  The preview's example year is built at the same cadence. */
export const revalidate = 86_400;

/** Example birthday the preview opens on, same as the sales page. */
const SAMPLE_BIRTHDATE = "1991-02-17";

export default async function Home() {
  const sample = await buildYearBlueprint(SAMPLE_BIRTHDATE);

  return (
    <div className="flex min-h-svh flex-col bg-brand-paper text-brand-ink">
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col justify-center py-3 sm:py-6">
          <LandingCalculator />
          <p className="mt-6 text-center text-sm">
            <Link
              href="/explore"
              className="text-brand-ink-soft underline underline-offset-4 transition hover:text-brand-ink"
            >
              Explore →
            </Link>
          </p>
        </div>

        <section
          aria-labelledby="home-preview-title"
          className="mx-auto w-full max-w-md px-5 pb-16 pt-10 sm:pt-14"
        >
          <p className="type-eyebrow text-center text-brand-bronze">
            The 52xSeven Blueprint · {DEEP_DIVE_PRICE_LABEL}
          </p>
          <h2
            id="home-preview-title"
            className="mt-2 text-center font-serif text-2xl leading-tight text-brand-ink"
          >
            Your card is the start. This is the year it builds.
          </h2>
          <p className="mx-auto mt-3 max-w-[28em] text-center text-sm leading-relaxed text-brand-ink-soft">
            Seven chapters, fifty-two days each. Put your birthday in the phone
            below and tap through your own — the chapter you&rsquo;re standing in
            today, and the six still coming.
          </p>
          <YearPreviewApp sample={sample} source="home-landing" className="mt-6" />
          <p className="mt-4 text-center text-sm">
            <Link
              href={DEEP_DIVE_PRODUCT_PATH}
              className="text-brand-ink underline underline-offset-4"
            >
              What&rsquo;s inside the 52xSeven Blueprint →
            </Link>
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
