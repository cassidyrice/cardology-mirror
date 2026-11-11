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

const HOME_TITLE = "Card Blueprints: Free Birth Card Lookup & Personal Cardology Readings";
const HOME_DESCRIPTION =
  "Find your playing-card birth card free in seconds. Order The Card Blueprint Reading ($99) inline—Suggested Questions plus up to 3 questions over 48 hours.";

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

export default function Home() {
  return (
    <div className="home paper-shell flex min-h-svh flex-col bg-brand-paper text-brand-ink">
      {/* The stage film's poster is the first screen's largest paint. */}
      <link rel="preload" as="image" href="/video/hero-loop-poster-9x16.webp" fetchPriority="high" />
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col">
        <div className="split">
          <div className="stage-wrap">
            <Stage />
          </div>
          <div className="split-column">
            <InView as="section" className="hero" aria-labelledby="home-purpose-title">
              <div className="hero-block">
                <p className="hero-micro-signal rise">
                  <span>52 cards · fixed by birth date</span>
                  <span aria-hidden="true">·</span>
                  <span>Email or text readings</span>
                </p>
                <h1 id="home-purpose-title" className="rise">
                  A little more clarity.<br />A different conversation.
                </h1>
                <p className="hero-lead rise-2" data-ai-summary>
                  Start with the playing card your birthday gave you—or bring your real question and never leave this page.
                </p>
                <div className="hero-form rise-3">
                  <LandingCalculator />
                </div>
              </div>
              <p className="hero-name" aria-hidden="true">
                <span>card</span> <span>blueprints</span>
              </p>
            </InView>

            <InView as="section" id="how-it-works" className="slip-section" aria-labelledby="home-find-birth-card">
              <h2 id="home-find-birth-card" data-rise style={{ "--rise-i": 0 } as React.CSSProperties}>
                How do I find my birth card?
              </h2>
              <p className="slip-intro" data-rise style={{ "--rise-i": 1 } as React.CSSProperties}>
                Your birthday maps to one playing card in a 52-card deck. It is a fixed mirror, not a prediction. Month and day set the permanent card; your birth year unlocks your active 52-day planetary windows. Bring one real question, pay inline without leaving the page, and get a sharp written answer by email or text message.
              </p>
              <Slip />
            </InView>

            <InView as="section" id="readings" className="readings" aria-labelledby="home-reading-title">
              <h2 id="home-reading-title" data-rise style={{ "--rise-i": 0 } as React.CSSProperties}>
                One reading. Zero leaving the page.
              </h2>
              <p className="readings-lead" data-rise style={{ "--rise-i": 1 } as React.CSSProperties}>
                <strong>The Card Blueprint Reading ($99)</strong> gives you an instant download of Suggested Questions right after payment, plus a 48-hour Reading Pass to ask up to 3 questions of your own—solo timing or two-person compatibility. Cass reviews three angles on every question and sends the sharpest one to your inbox or phone within 48 hours, almost all in under 24 hours.
              </p>
              <div data-rise style={{ "--rise-i": 2 } as React.CSSProperties}>
                <StageCue>
                  <ManualReadingOffers />
                </StageCue>
              </div>
            </InView>
          </div>
        </div>

        <InView as="div">
          <section className="home-reading-desk" aria-labelledby="home-sample-title">
            <ReadingSample />
          </section>
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
