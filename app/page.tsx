import type { Metadata } from "next";
import Link from "next/link";

import { BlueprintHero } from "@/components/bp/BlueprintHero";
import { Gem, type GemSuit } from "@/components/bp/Gem";
import { PlanetGlyph } from "@/components/bp/PlanetGlyph";
import { FreeBars } from "@/components/home/FreeBars";
import { ReadingSample } from "@/components/offers/ReadingSample";
import { ManualReadingOffers } from "@/components/offers/ManualReadingOffers";
import { SiteFooter } from "@/components/seo/SiteFooter";
import { SiteHeader } from "@/components/seo/SiteHeader";
import { PLANET_ORDER, type PlanetName } from "@/lib/types";

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

const SUITS: Array<{ suit: GemSuit; name: string; range: string; theme: string }> = [
  { suit: "heart", name: "Hearts", range: "01–13", theme: "Love, family, feeling" },
  { suit: "club", name: "Clubs", range: "14–26", theme: "Mind, ideas, words" },
  { suit: "diamond", name: "Diamonds", range: "27–39", theme: "Values, money, worth" },
  { suit: "spade", name: "Spades", range: "40–52", theme: "Work, health, wisdom" },
];

const PERIOD_THEME: Record<PlanetName, string> = {
  Mercury: "Ideas, news, quick moves",
  Venus: "Love, home, pleasure",
  Mars: "Drive, effort, conflict",
  Jupiter: "Growth, money, luck",
  Saturn: "Limits, lessons, health",
  Uranus: "Change, surprise, freedom",
  Neptune: "Dreams, travel, endings",
};

export default function Home() {
  return (
    <div className="home bp-page flex min-h-svh flex-col">
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col">
        <BlueprintHero />

        <section id="how-it-works" className="bp-section" aria-labelledby="home-find-birth-card">
          <div className="bp-rule-head">
            <span className="bp-label">How it works</span>
          </div>
          <div className="bp-split">
            <div className="bp-split-copy">
              <h2 id="home-find-birth-card" className="bp-h2">
                How do I find my birth card?
              </h2>
              <p>
                Your birthday maps to one playing card in a 52-card deck. It is a fixed mirror, not a prediction:
                the same date always gives the same card. Month and day set the card; your birth year adds the
                timing, seven 52-day planetary periods that start on each birthday.
              </p>
              <p className="bp-formula">
                <span className="bp-label">Solar value</span>
                <span className="bp-mono">55 − (2 × month + day)</span>
              </p>
              <p className="bp-quiet bp-mono">
                Feb 17 → 55 − (4 + 17) = 34 → 34th card → <span className="bp-red">8 of Diamonds</span>
              </p>
              <Link href="/methodology">Check the math</Link>
            </div>
            <ul className="bp-deck" aria-label="The four suits and the Joker">
              {SUITS.map((s) => (
                <li key={s.suit}>
                  <span className="bp-label">{s.range}</span>
                  <Gem suit={s.suit} size={48} />
                  <span className="bp-deck-name">{s.name}</span>
                  <span className="bp-quiet">{s.theme}</span>
                </li>
              ))}
              <li>
                <span className="bp-label">00</span>
                <span className="bp-deck-joker" aria-hidden="true">★</span>
                <span className="bp-deck-name">Joker</span>
                <span className="bp-quiet">December 31 only</span>
              </li>
            </ul>
          </div>

          <ol className="bp-periods" aria-label="The seven periods of a year">
            {PLANET_ORDER.map((planet, i) => (
              <li key={planet}>
                <PlanetGlyph planet={planet} size={26} />
                <span className="bp-deck-name">{planet}</span>
                <span className="bp-quiet">{PERIOD_THEME[planet]}</span>
                <span className="bp-label">Day {String(i * 52).padStart(3, "0")}</span>
              </li>
            ))}
          </ol>
        </section>

        <section id="readings" className="bp-section bp-readings" aria-labelledby="home-reading-title">
          <div className="bp-rule-head">
            <span className="bp-label">The Card Blueprint Reading · $99</span>
          </div>
          <h2 id="home-reading-title" className="bp-h2">
            Ask up to three questions. Get written answers from your exact spread.
          </h2>
          <p className="bp-lead">
            Pay once and get the Suggested Questions guide right away, then a 48-hour pass to ask up to 3
            questions: your own timing, or two people. Cass reviews each answer against your spread and sends it
            by email or text within 48 hours.
          </p>
          <ManualReadingOffers />
        </section>

        <section className="home-reading-desk" aria-labelledby="home-sample-title">
          <ReadingSample />
        </section>

        <section className="free" aria-labelledby="home-free-title">
          <FreeBars />
        </section>

        <section className="bp-section bp-cta" aria-labelledby="home-start-title">
          <div className="bp-panel bp-reg bp-cta-panel">
            <div className="bp-cta-gems" aria-hidden="true">
              {SUITS.map((s) => (
                <Gem key={s.suit} suit={s.suit} size={30} />
              ))}
            </div>
            <h2 id="home-start-title" className="bp-h2">
              Ten seconds. One card. Free.
            </h2>
            <div className="bp-actions">
              <a href="#home-birthdate" className="bp-button">
                Find my card
              </a>
              <a href="#ask-question-inline" className="bp-button bp-button--line">
                Book a reading · $99
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
