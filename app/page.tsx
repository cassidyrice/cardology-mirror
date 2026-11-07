import type { Metadata } from "next";

import { Closing } from "@/components/home/Closing";
import { FreeBars } from "@/components/home/FreeBars";
import { Slip } from "@/components/home/Slip";
import { Stage } from "@/components/home/Stage";
import { StageCue } from "@/components/home/StageCue";
import { InView } from "@/components/motion/InView";
import { LandingCalculator } from "@/components/seo/LandingCalculator";
import { ReadingSample } from "@/components/offers/ReadingSample";
import { ManualReadingOffers } from "@/components/offers/ManualReadingOffers";
import { SiteFooter } from "@/components/seo/SiteFooter";
import { SiteHeader } from "@/components/seo/SiteHeader";

import "./landing.css";

const HOME_TITLE = "Cardology Chart: Find Your Birth Card Free | Card Blueprints";
const HOME_DESCRIPTION =
  "Find your birth card free. Then get the $13 Birth Card Blueprint, or let Cass read your year, a pair, or the whole family.";

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
        alt: "Card Blueprints: your birth card as a mirror",
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

/**
 * The split stage (docs/design/DIRECTION.md). The left half never moves: the
 * real deck on film, then your card. The right half is the reading: the hero,
 * how a reading happens, the readings as a menu. Below the split, three
 * full-width sections: the sample, everything free, and the last picture.
 */
export default function Home() {
  return (
    <div className="home paper-shell flex min-h-svh flex-col bg-brand-paper text-brand-ink">
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col">
        <div className="split">
          <div className="stage-wrap">
            <Stage />
          </div>
          <div className="split-column">
            <InView as="section" className="hero" aria-labelledby="home-purpose-title">
              <h1 id="home-purpose-title" className="rise">
                A little more clarity.<br />A different conversation.
              </h1>
              <p className="hero-lead rise-2" data-ai-summary>
                Start with the playing card your birthday gave you.
              </p>
              <div className="hero-form rise-3">
                <LandingCalculator />
              </div>
            </InView>
            <p className="hero-name" aria-hidden="true">
              <span>card</span> <span>blueprints</span>
            </p>

            <InView as="section" id="how-it-works" className="slip-section" aria-labelledby="home-find-birth-card">
              <Slip />
            </InView>

            <InView as="section" id="readings" className="readings" aria-labelledby="home-reading-title">
              <h2 id="home-reading-title" data-rise style={{ "--rise-i": 0 } as React.CSSProperties}>
                Where do you start? Be honest.
              </h2>
              <p className="readings-lead" data-rise style={{ "--rise-i": 1 } as React.CSSProperties}>
                Start with your own Birth Card Blueprint. Or have Cass read your year, a pair, or your whole family. Everything arrives privately by email. Nobody has to know you asked.
              </p>
              <div data-rise style={{ "--rise-i": 2 } as React.CSSProperties}>
                <StageCue>
                  <ManualReadingOffers />
                </StageCue>
              </div>
            </InView>
          </div>
        </div>

        <InView as="section" className="sample" aria-labelledby="home-sample-title">
          <ReadingSample />
        </InView>

        <InView as="section" className="free" aria-labelledby="home-free-title">
          <FreeBars />
        </InView>

        <InView as="section" className="closing" aria-labelledby="home-start-title">
          <Closing />
        </InView>
      </main>
      <SiteFooter />
    </div>
  );
}
