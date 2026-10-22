import type { Metadata } from "next";
import Link from "next/link";

import { LandingCalculator } from "@/components/seo/LandingCalculator";
import { ReadingSample } from "@/components/offers/ReadingSample";
import { ManualReadingOffers } from "@/components/offers/ManualReadingOffers";
import { SiteFooter } from "@/components/seo/SiteFooter";
import { SiteHeader } from "@/components/seo/SiteHeader";
import { HeroLoop } from "@/components/home/HeroLoop";

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

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col bg-brand-paper text-brand-ink">
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col">
        <div className="home-hero-video">
          <HeroLoop />
        <div className="home-blueprint-grid">
          <section className="home-purpose" aria-labelledby="home-purpose-title">
            <h1 id="home-purpose-title">A little more clarity.<br /><em>A different conversation.</em></h1>
            <p className="home-purpose-lead" data-ai-summary>You bring the same patterns to your relationships, your choices, and your year. You just haven’t looked. Start with the playing card your birthday gave you.</p>
            <a href="#home-birthdate" className="ink-button large-button">Find your card free</a>
            <Link href="#readings" className="editorial-link home-secondary">Skip ahead to a personal reading</Link>
            <p className="home-purpose-note">An old card system. Your judgment still applies.</p>
          </section>
          <div className="home-calculator-panel"><LandingCalculator /></div>
        </div>
        </div>
        <section className="home-question home-method" aria-labelledby="home-find-birth-card"><h2 id="home-find-birth-card">How do I find my birth card?</h2><p>Your birthday maps to one playing card in a 52-card deck. Enter your month, day, and year in the free calculator. Month and day set the birth card. The year handles timing. Read the meaning as a prompt, not a forecast. It has no idea what happens Thursday.</p><Link href="/methodology" className="editorial-link">Check the math. We show our work</Link></section>
        <section className="home-explainer" aria-label="Card Blueprints explainer video">
          <video controls playsInline preload="none" poster="/video/explainer-poster.webp" width={1280} height={720}>
            <source src="/video/explainer-16x9.mp4" type="video/mp4" />
            <track kind="captions" src="/video/explainer.en.vtt" srcLang="en" label="English" />
          </video>
        </section>
        <section className="home-reading-desk" aria-labelledby="home-sample-title">
          <div><p className="home-kicker">Notes from the reading desk</p><h2 id="home-sample-title">Something you’ll recognize.<br />Something you’ll argue with.</h2><p>A reading is a place to start. The strengths you lean on too hard. The habits that keep starting the same fight. Questions you can take back into your actual life.</p><p>The cards and dates are math. The meanings come from the Cardology tradition. What fits is your call. You already know which parts will.</p><a className="editorial-link" href="/samples/chemistry-check-fictional-sample.pdf">Read a fictional Chemistry Check sample (PDF)</a><br /><a className="editorial-link" href="/samples/birth-card-blueprint-sample.pdf">Read a sample Birth Card Blueprint (PDF)</a><p className="home-sample-note">Sample people. Sample dates. These are the calculated report pages. Your real reading also has Cass’s written interpretation, which is the part you’ll reread.</p></div>
          <ReadingSample />
        </section>

        <section id="readings" aria-labelledby="home-reading-title" className="mx-auto w-full max-w-6xl scroll-mt-8 border-t border-brand-line px-5 py-12 sm:px-8 sm:py-16 lg:px-10">
          <div className="home-offers-heading">
            <p className="home-kicker">Personal readings · from $13</p>
            <h2 id="home-reading-title" className="mt-3 font-serif text-4xl leading-tight tracking-tight sm:text-5xl">Where do you start? Be honest.</h2>
            <p className="mt-4 leading-relaxed text-brand-ink-soft">Start with your own Birth Card Blueprint. Or have Cass read your year, a pair, or your whole family. Everything arrives privately by email. Nobody has to know you asked.</p>
          </div>
          <ManualReadingOffers />
        </section>

        <section className="home-articles" aria-labelledby="home-articles-title">
          <div className="home-articles-heading"><div><p className="home-kicker">From the journal</p><h2 id="home-articles-title">Read about your cards. Then go live.</h2></div><p>Three places to start. Read a little. Then put the phone down and catch it happening in your own life.</p></div>
          <div className="home-article-grid">
            <Link className="home-article" href="/blog/how-to-read-birth-card-meaning"><span className="home-article-label">01 / Your Birth Card</span><h3>How to read your Birth Card</h3><p>Its themes, written as questions. Answer them honestly, for once.</p><span className="home-article-read">Read the article <span aria-hidden="true">↗</span></span></Link>
            <Link className="home-article" href="/blog/52-day-periods-in-cardology"><span className="home-article-label">02 / Your year</span><h3>How your 52-day chapters work</h3><p>Your birthday year runs in chapters, Mercury through Neptune. You are in one right now.</p><span className="home-article-read">Read the article <span aria-hidden="true">↗</span></span></Link>
            <Link className="home-article" href="/blog/birth-card-vs-ruling-card-how-to-read-both"><span className="home-article-label">03 / Another perspective</span><h3>Birth Card or Ruling Card?</h3><p>What each one brings to a reading. How to read the two together without spiraling.</p><span className="home-article-read">Read the article <span aria-hidden="true">↗</span></span></Link>
          </div>
          <Link className="home-articles-all" href="/blog">Browse every article <span aria-hidden="true">→</span></Link>
        </section>

        <section className="home-start" aria-labelledby="home-start-title">
          <div><p className="home-kicker">Still here?</p><h2 id="home-start-title">Follow the itch.</h2><p>One card. One connection. Or the basics. Most of it is free, so stop hovering.</p></div>
          <div className="home-reading-links">
            <Link href="/birth-card"><span>01 / The library</span><strong>Look at all 52 birth cards ↗</strong></Link>
            <Link href="/birth-card-compatibility-calculator"><span>02 / Your connections</span><strong>Compare your card with theirs ↗</strong></Link>
            <Link href="/cardology-for-beginners"><span>03 / The foundations</span><strong>Learn how Cardology actually works ↗</strong></Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
