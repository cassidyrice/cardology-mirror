import type { Metadata } from "next";

import { AboutCassSection } from "@/components/home/AboutCassSection";
import { CompareBand } from "@/components/home/CompareBand";
import { DeepDiveSection } from "@/components/home/DeepDiveSection";
import { EmailSignupSection } from "@/components/home/EmailSignupSection";
import { HomepageCalculatorHero } from "@/components/home/HomepageCalculatorHero";
import { LatestBlogSection } from "@/components/home/LatestBlogSection";
import { StartHereSection } from "@/components/home/StartHereSection";
import { TodaysCardSection } from "@/components/home/TodaysCardSection";
import { SiteFooter } from "@/components/seo/SiteFooter";
import { SiteHeader } from "@/components/seo/SiteHeader";

const EXPLORE_TITLE = "Explore Card Blueprints";
const EXPLORE_DESCRIPTION =
  "Everything under the hood: your birth card, today's card, compatibility, meanings, and the rest of the library.";

export const metadata: Metadata = {
  title: { absolute: EXPLORE_TITLE },
  description: EXPLORE_DESCRIPTION,
  alternates: { canonical: "/explore" },
  openGraph: {
    title: EXPLORE_TITLE,
    description: EXPLORE_DESCRIPTION,
    url: "/explore",
    images: [
      {
        url: "/og/default.png",
        width: 1200,
        height: 630,
        alt: "Card Blueprints — explore the library",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: EXPLORE_TITLE,
    description: EXPLORE_DESCRIPTION,
    images: ["/og/default.png"],
  },
};

/** Today's card rotates daily; revalidate so HTML stays fresh for crawlers. */
export const revalidate = 86_400;

/** Former home page, kept intact as the indexable library. */
export default function ExplorePage() {
  return (
    <div className="bg-brand-paper text-brand-ink">
      <SiteHeader />

      <main id="main-content" tabIndex={-1}>
        <HomepageCalculatorHero title="Everything under the hood" />
        <TodaysCardSection />
        <LatestBlogSection />
        <CompareBand />
        <DeepDiveSection />
        <StartHereSection />
        <AboutCassSection />
        <EmailSignupSection />
      </main>

      <SiteFooter />
    </div>
  );
}
