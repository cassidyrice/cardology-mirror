import type { Metadata } from "next";
import Link from "next/link";

import { LandingCalculator } from "@/components/seo/LandingCalculator";
import { YearPreviewApp } from "@/components/year/YearPreviewApp";
import { DEEP_DIVE_PRICE_LABEL, DEEP_DIVE_PRODUCT_PATH } from "@/lib/deep-dive";
import { buildYearBlueprint } from "@/lib/year-blueprint";
import { toYearPreview } from "@/lib/year-preview";
import { SiteFooter } from "@/components/seo/SiteFooter";
import { SiteHeader } from "@/components/seo/SiteHeader";

import "./landing.css";

const HOME_TITLE = "Find Your Birth Card Free | Card Blueprints";
const HOME_DESCRIPTION =
  "Your birthday maps to one playing card — same date, same card. Free Cardology calculator, then the $19 52xSeven Blueprint for your whole year.";

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
  const sample = toYearPreview(await buildYearBlueprint(SAMPLE_BIRTHDATE));

  return (
    <div className="flex min-h-svh flex-col bg-brand-paper text-brand-ink">
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col">
        <div className="home-intro">
          <p className="home-kicker">A little self-knowledge. A new place to start.</p>
          <LandingCalculator />
          <div className="home-intro-links">
            <Link href="/what-is-cardology">New to Cardology?</Link>
            <span aria-hidden="true">·</span>
            <Link href="/explore">Explore the free library →</Link>
          </div>
        </div>

        <section aria-labelledby="home-preview-title" className="home-product">
          <div className="home-product-copy">
            <p className="home-kicker">The 52xSeven Blueprint</p>
            <h2 id="home-preview-title">Meet your card.<br />Make sense of your year.</h2>
            <p className="home-product-lead">
              Some patterns are easier to see when you have a place to look.
              Your Blueprint brings your birth card, your current chapter,
              and the themes of your year into one personal reading.
            </p>
            <div className="home-offer">
              <span className="home-price">{DEEP_DIVE_PRICE_LABEL}</span>
              <div>One payment. Your year to explore.<small>12 months of access · no automatic renewal</small></div>
            </div>
            <ol className="home-benefits">
              <li><span>01</span><div><h3>Recognize your patterns</h3><p>Read the strengths you lean on and the shadow patterns worth noticing.</p></div></li>
              <li><span>02</span><div><h3>Find your place in the year</h3><p>See your current chapter, its dates, and a practical prompt to reflect on.</p></div></li>
              <li><span>03</span><div><h3>Return as the year unfolds</h3><p>Explore all seven chapters and the story that connects them. Your Now screen moves with the calendar.</p></div></li>
            </ol>
            <Link className="home-product-link" href={DEEP_DIVE_PRODUCT_PATH}>Explore the full Blueprint <span aria-hidden="true">↗</span></Link>
            <p className="home-purchase-note">Instant access after payment. Your sign-in link arrives by email.</p>
          </div>
          <YearPreviewApp sample={sample} source="home-landing" className="home-product-preview" />
        </section>

        <section className="home-articles" aria-labelledby="home-articles-title">
          <div className="home-articles-heading"><div><p className="home-kicker">From the journal</p><h2 id="home-articles-title">Get to know your cards.</h2></div><p>A few good places to start. Read a little, then bring it back to your own life.</p></div>
          <div className="home-article-grid">
            <Link className="home-article" href="/blog/how-to-read-birth-card-meaning"><span className="home-article-label">01 / Your Birth Card</span><h3>How to read your Birth Card</h3><p>Explore its themes as questions to reflect on, with room for your own experience.</p><span className="home-article-read">Read the article <span aria-hidden="true">↗</span></span></Link>
            <Link className="home-article" href="/blog/52-day-periods-in-cardology"><span className="home-article-label">02 / Your year</span><h3>How your 52-day chapters work</h3><p>Get to know the seven planetary periods that give your birthday year its structure.</p><span className="home-article-read">Read the article <span aria-hidden="true">↗</span></span></Link>
            <Link className="home-article" href="/blog/birth-card-vs-ruling-card-how-to-read-both"><span className="home-article-label">03 / Another perspective</span><h3>Birth Card or Ruling Card?</h3><p>Understand what each brings to a reading and how to read the two together.</p><span className="home-article-read">Read the article <span aria-hidden="true">↗</span></span></Link>
          </div>
          <Link className="home-articles-all" href="/blog">Browse all articles <span aria-hidden="true">→</span></Link>
        </section>

        <section className="home-start" aria-labelledby="home-start-title">
          <div><p className="home-kicker">Keep exploring</p><h2 id="home-start-title">Follow your curiosity.</h2><p>Start with one card, a connection, or the basics. There’s plenty to discover for free.</p></div>
          <div className="home-reading-links">
            <Link href="/birth-card"><span>01 / The library</span><strong>Explore all 52 birth cards ↗</strong></Link>
            <Link href="/birth-card-compatibility-calculator"><span>02 / Your connections</span><strong>Compare two birth cards ↗</strong></Link>
            <Link href="/cardology-for-beginners"><span>03 / The foundations</span><strong>Learn how Cardology works ↗</strong></Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
