import type { Metadata } from "next";
import Link from "next/link";

import { LandingCalculator } from "@/components/seo/LandingCalculator";
import { SiteFooter } from "@/components/seo/SiteFooter";
import { SiteHeader } from "@/components/seo/SiteHeader";

import "./landing.css";

const HOME_TITLE = "Cardology Chart: Find Your Birth Card Free | Card Blueprints";
const HOME_DESCRIPTION =
  "Your birthday maps to one playing card. Same date, same card. Free Cardology calculator, then hand-written readings for you and the people in your life.";

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
  return (
    <div className="flex min-h-svh flex-col bg-brand-paper text-brand-ink">
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col">
        <div className="home-intro">
          <p className="home-lead" data-ai-summary>
            Your birthday maps to one playing card in a 52-card deck.
            Use it as a mirror, not a forecast. Find yours free below.
          </p>
          <LandingCalculator />
          <section className="home-question" aria-labelledby="home-find-birth-card">
            <h2 id="home-find-birth-card">How do I find my birth card?</h2>
            <p>
              Enter month, day, and year above. Month and day pick the card; the year
              does not change it. The same birthday always returns the same playing card.
            </p>
            <p>
              The full chart is on the{" "}
              <Link href="/birth-card-calculator">birth card calculator</Link>.
              All 52 meanings are on the{" "}
              <Link href="/birth-card">birth card index</Link>.
              The system is{" "}
              <Link href="/what-is-cardology">what Cardology is</Link>.
              Two cards together:{" "}
              <Link href="/cardology-compatibility">Cardology compatibility</Link>.
            </p>
          </section>
        </div>

        <section className="home-articles" aria-labelledby="home-articles-title">
          <div className="home-articles-heading"><div><p className="home-kicker">From the journal</p><h2 id="home-articles-title">Get to know your cards.</h2></div><p>A few good places to start. Read a little, then bring it back to your own life.</p></div>
          <div className="home-article-grid">
            <Link className="home-article" href="/blog/how-to-read-birth-card-meaning"><span className="home-article-label">01 / Your Birth Card</span><h3>How to read your Birth Card</h3><p>Explore its themes as questions to reflect on, with room for your own experience.</p><span className="home-article-read">Read the article <span aria-hidden="true">↗</span></span></Link>
            <Link className="home-article" href="/blog/52-day-periods-in-cardology"><span className="home-article-label">02 / Your year</span><h3>How your 52-day chapters work</h3><p>Get to know the seven planetary periods that give your birthday year its structure.</p><span className="home-article-read">Read the article <span aria-hidden="true">↗</span></span></Link>
            <Link className="home-article" href="/blog/birth-card-vs-ruling-card-how-to-read-both"><span className="home-article-label">03 / Another perspective</span><h3>Birth Card or Ruling Card?</h3><p>Understand what each brings to a reading and how to read the two together.</p><span className="home-article-read">Read the article <span aria-hidden="true">↗</span></span></Link>
          </div>
          <Link className="home-articles-all" href="/explore">Explore the learning library <span aria-hidden="true">→</span></Link>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
