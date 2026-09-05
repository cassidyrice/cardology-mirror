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

const HOME_TITLE = "Find Your Birth Card | Card Blueprints";
const HOME_DESCRIPTION =
  "Your birthday adds up to one playing card. Find yours free, compare it with anyone, and get today's card. Cardology, done plainly.";

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

/** Today's card rotates daily; revalidate so HTML stays fresh for crawlers. */
export const revalidate = 86_400;

export default function Home() {
  // WebSite + Organization JSON-LD live in app/layout.tsx — do not duplicate.
  return (
    <div className="bg-brand-paper text-brand-ink">
      <SiteHeader />

      <main id="main-content" tabIndex={-1}>
        <HomepageCalculatorHero />
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
