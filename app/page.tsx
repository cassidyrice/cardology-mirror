import type { Metadata } from "next";
import Link from "next/link";

import { LandingCalculator } from "@/components/seo/LandingCalculator";
import {
  DEEP_DIVE_PRICE_LABEL,
  DEEP_DIVE_PRODUCT_PATH,
} from "@/lib/deep-dive";
import { SiteFooter } from "@/components/seo/SiteFooter";
import { SiteHeader } from "@/components/seo/SiteHeader";

import "./landing.css";

const HOME_TITLE = "Find Your Birth Card Free | Card Blueprints";
const HOME_DESCRIPTION =
  "Your birthday maps to one playing card. Same date, same card. Free Cardology calculator, then a $13 written reading on the one question you're deciding.";

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

/** From a real reading for an Eight of Diamonds who asked about a promotion. */
const SAMPLE_EXCERPT =
  "The 8 of Diamonds in you wants proof before it moves, the Queen of Spades in you wants to stay in the grind because you've earned mastery there, and the 7 of Clubs in you already knows some of that caution is just fear wearing a practical coat. The promotion matches what Pluto is asking for, a new value project, untested ground. Staying matches the comfort of a role where your worth is already proven. Which one sounds like growth to you, and which one sounds like hiding in a job well done?";

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col bg-brand-paper text-brand-ink">
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col">
        <div className="home-intro">
          <p className="home-kicker">Arithmetic on a fixed 52-card structure. You can check it.</p>
          <LandingCalculator />
          <div className="home-intro-links">
            <Link href="/what-is-cardology">New to Cardology?</Link>
            <span aria-hidden="true">·</span>
            <Link href="/explore">Explore the free library →</Link>
          </div>
        </div>

        <section aria-labelledby="home-reading-title" className="home-product">
          <div className="home-product-copy">
            <p className="home-kicker">One Question Reading</p>
            <h2 id="home-reading-title">Ask the one thing<br />you keep circling.</h2>
            <p className="home-product-lead">
              Your birthday picks the cards. Your question picks the reading.
              About 600 words on where you are standing, written so plainly
              you will think you wrote it, and three things to keep an eye out
              for in the next few weeks.
            </p>
            <div className="home-offer">
              <span className="home-price">{DEEP_DIVE_PRICE_LABEL}</span>
              <div>One question, written for you.<small>Usually ready in about a minute · no subscription</small></div>
            </div>
            <ol className="home-benefits">
              <li><span>01</span><div><h3>Your card, on your question</h3><p>The number is the action, the suit is the area. How your card tends to handle this exact kind of decision, and where it slips.</p></div></li>
              <li><span>02</span><div><h3>This year&rsquo;s cards</h3><p>The Long Range card that keeps pulling your attention. The Pluto card, what the year asks, and what it pays.</p></div></li>
              <li><span>03</span><div><h3>Three things to watch for</h3><p>Concrete signals for the next few weeks, each tied to a card. You check them off yourself.</p></div></li>
            </ol>
            <Link className="home-product-link" href={DEEP_DIVE_PRODUCT_PATH}>Read a sample, then ask yours <span aria-hidden="true">↗</span></Link>
            <p className="home-purchase-note">Prepared automatically from your cards and question. Usually ready in about a minute. Reply to your receipt if you need help.</p>
          </div>
          <aside className="home-product-preview home-sample" aria-label="A piece of one reading">
            <p className="home-kicker">A piece of one reading</p>
            <blockquote className="home-sample-quote">{SAMPLE_EXCERPT}</blockquote>
            <p className="home-sample-note">From a reading for an Eight of Diamonds who asked about a promotion.</p>
          </aside>
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
