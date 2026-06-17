import Link from "next/link";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { APP_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "Cardology Pro - Birth Card Calculator and Card Blueprint" },
  description:
    "Find your fixed birth card, test it as a practical pattern map, and turn it into a written Card Blueprint. Deterministic math, honest limits, no forecast claims.",
  alternates: { canonical: "/" },
};

const proofPoints = [
  {
    label: "fixed birth-card math",
    detail: "Same birthday, same structure. No draw, mood, reader, or refresh changes the result.",
  },
  {
    label: "free first read",
    detail: "Start with the calculator and see whether the basic mirror earns more attention.",
  },
  {
    label: "written pattern map",
    detail: "The Card Blueprint turns the fixed structure into one fuller reading.",
  },
  {
    label: "limits named clearly",
    detail: "The system gives you a frame. You decide what clarifies and what does not.",
  },
];

const pathSteps = [
  {
    label: "01",
    title: "Calculate the fixed card.",
    detail:
      "Enter your birth date and get the card structure assigned to that date. Same input, same output.",
  },
  {
    label: "02",
    title: "Test the pattern.",
    detail:
      "Use the card meaning as a practical prompt for the patterns you recognize, avoid, repeat, or argue with.",
  },
  {
    label: "03",
    title: "Get the written Blueprint.",
    detail:
      "When the first mirror is useful, turn the structure into a clearer written report.",
  },
];

const reflectionFrames = [
  "what repeats when you are under pressure",
  "where work, money, love, and self-trust ask for attention",
  "what you tend to overplay, withhold, defend, or miss",
  "which timing language gives the current chapter a useful frame",
  "what feels accurate enough to test, and what you can leave behind",
];

const blueprintItems = [
  {
    label: "Birth-card structure",
    detail: "The fixed cards and positions generated from your birth date, kept separate from interpretation.",
  },
  {
    label: "Pattern map",
    detail: "A written pass through pressure, decisions, relationships, money, work, and self-trust.",
  },
  {
    label: "Cycle frames",
    detail: "Timing language for reflection, not prediction, certainty, or manufactured urgency.",
  },
  {
    label: "Practical prompts",
    detail: "Questions you can use after the reading, without pretending the system proves who you are.",
  },
];

const notClaims = [
  "predict a future event",
  "prove destiny",
  "diagnose personality",
  "use randomness at the calculation layer",
  "borrow scientific validation it does not have",
];

const cardStack = ["A♠", "7♥", "Q♦", "3♣", "9♠"];

export default function Home() {
  return (
    <>
      <main className="landing-oracle relative min-h-dvh overflow-hidden bg-[#f4f0e7] text-[#14110d]">
        <div className="oracle-grid" aria-hidden="true" />
        <div className="oracle-noise" aria-hidden="true" />

        <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between border-b border-[#14110d]/15 px-5 py-4 sm:px-8 lg:px-10">
          <Link href="/" className="brand-mark" aria-label="Cardology Pro home">
            Cardology Pro
          </Link>
          <nav className="hidden items-center gap-6 text-[0.72rem] uppercase text-[#14110d]/70 md:flex">
            <Link href="/birth-card-calculator" className="transition hover:text-[#14110d]">
              Find Your Card
            </Link>
            <a href={`${APP_URL}/onboarding`} className="transition hover:text-[#14110d]">
              Card Blueprint
            </a>
            <Link href="/what-is-cardology" className="transition hover:text-[#14110d]">
              The Method
            </Link>
            <Link href="/52-card-astrology-explained" className="transition hover:text-[#14110d]">
              Honest Limits
            </Link>
          </nav>
          <a href={`${APP_URL}/onboarding`} className="ink-button small-button">
            Get Blueprint
          </a>
        </header>

        <section className="relative z-10 mx-auto grid min-h-[calc(100dvh-69px)] w-full max-w-7xl items-start gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[1.03fr_0.97fr] lg:px-10">
          <div className="max-w-3xl">
            <p className="oracle-eyebrow animate-[fade-up_0.7s_cubic-bezier(0.22,1,0.36,1)_both]">
              free birth card calculator to written Card Blueprint
            </p>

            <h1 className="hero-title mt-5 animate-[fade-up_0.7s_cubic-bezier(0.22,1,0.36,1)_0.08s_both]">
              Mirror, <span>not forecast.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-pretty font-serif text-2xl leading-relaxed text-[#3d352d] animate-[fade-up_0.7s_cubic-bezier(0.22,1,0.36,1)_0.16s_both] sm:text-3xl">
              Find the card your birthday maps to. If the mirror is useful, turn it into a written pattern map.
            </p>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#5b5148] animate-[fade-up_0.7s_cubic-bezier(0.22,1,0.36,1)_0.22s_both] sm:text-lg">
              Same birthday, same card structure; no draw, forecast, or borrowed certainty. Use the result as pattern language for pressure, timing, relationships, work, money, and self-trust.
            </p>

            <div className="mt-7 flex flex-col gap-3 animate-[fade-up_0.7s_cubic-bezier(0.22,1,0.36,1)_0.28s_both] sm:flex-row">
              <Link href="/birth-card-calculator" className="ink-button large-button">
                Find your birth card <span aria-hidden="true">→</span>
              </Link>
              <a href={`${APP_URL}/onboarding`} className="paper-button large-button">
                Get the Card Blueprint
              </a>
            </div>
          </div>

          <aside className="hero-instrument animate-[fade-up_0.8s_cubic-bezier(0.22,1,0.36,1)_0.18s_both]" aria-label="Cardology Pro mirror principles">
            <div className="instrument-face">
              <div className="instrument-topline">
                <span>free card / written blueprint</span>
                <strong>visible math</strong>
              </div>

              <div className="card-orbit" aria-hidden="true">
                {cardStack.map((card, index) => (
                  <span key={card} style={{ "--i": index } as CSSProperties}>
                    {card}
                  </span>
                ))}
              </div>

              <div className="report-slip">
                <p className="slip-kicker">Card Blueprint</p>
                <p className="slip-title">Your fixed card, turned into a written pattern map.</p>
                <div className="slip-lines" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </div>
              </div>

              <ul className="offer-list">
                {proofPoints.map((item, index) => (
                  <li key={item.label} style={{ "--delay": `${0.28 + index * 0.08}s` } as CSSProperties}>
                    <span className="offer-count">0{index + 1}</span>
                    <span>
                      <strong>{item.label}</strong>
                      <small>{item.detail}</small>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </section>

        <section className="relative z-10 border-y border-[#14110d]/15 bg-[#14110d] px-5 py-16 text-[#f4f0e7] sm:px-8 lg:px-10">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="oracle-eyebrow text-[#c8bca8]">the focused purpose</p>
              <h2 className="mt-4 max-w-xl font-serif text-4xl leading-[0.98] sm:text-5xl">
                Answer the birthday question, then earn the deeper read.
              </h2>
            </div>
            <div className="space-y-5 text-base leading-relaxed text-[#d7cdbc] sm:text-lg">
              <p>
                Most people arrive asking a simple question: what card am I? Cardology Pro should answer that quickly, then show whether the answer gives them useful language for their patterns.
              </p>
              <p>
                The free calculator is the first step. The Card Blueprint is the product: a written reading built from the fixed card structure, with the limits named out loud.
              </p>
              <p className="font-serif text-2xl leading-snug text-[#f4f0e7]">
                Not a prophecy. Not a personality test wearing a costume. A structured mirror with visible machinery.
              </p>
            </div>
          </div>
        </section>

        <section className="relative z-10 px-5 py-16 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <p className="oracle-eyebrow">from curiosity to clarity</p>
            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              {pathSteps.map((step) => (
                <article key={step.label} className="border border-[#14110d]/18 bg-[#f4f0e7]/74 p-6 shadow-[0_1.5rem_4rem_rgba(20,17,13,0.08)] sm:p-8">
                  <p className="font-serif text-2xl text-[#9e3d24]">{step.label}</p>
                  <h2 className="mt-4 font-serif text-4xl leading-none sm:text-5xl">
                    {step.title}
                  </h2>
                  <p className="mt-5 text-base leading-relaxed text-[#5b5148] sm:text-lg">
                    {step.detail}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative z-10 border-y border-[#14110d]/15 bg-[#eadfcd] px-5 py-16 sm:px-8 lg:px-10">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
            <article>
              <p className="oracle-eyebrow">what the mirror can show</p>
              <h2 className="mt-4 font-serif text-4xl leading-none sm:text-5xl">
                Patterns you can test in a real week.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-[#4c4339] sm:text-lg">
                Cardology Pro takes your birth date, runs it through a fixed symbolic system, and returns a structure you can think with, challenge, or discard.
              </p>
              <ul className="mt-6 grid gap-3 text-sm leading-relaxed text-[#3d352d] sm:text-base">
                {reflectionFrames.map((item) => (
                  <li key={item} className="border-t border-[#14110d]/12 pt-3">
                    {item}
                  </li>
                ))}
              </ul>
            </article>

            <article className="border border-[#14110d]/18 bg-[#14110d] p-6 text-[#f4f0e7] shadow-[0_1.5rem_4rem_rgba(20,17,13,0.13)] sm:p-8">
              <p className="oracle-eyebrow text-[#c8bca8]">the line we hold</p>
              <h2 className="mt-4 font-serif text-4xl leading-none sm:text-5xl">
                No forecast claims. No borrowed certainty.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-[#d7cdbc] sm:text-lg">
                Cardology Pro does not claim to:
              </p>
              <ul className="mt-6 grid gap-3 text-sm leading-relaxed text-[#d7cdbc] sm:text-base">
                {notClaims.map((item) => (
                  <li key={item} className="border-t border-[#f4f0e7]/15 pt-3">
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-6 font-serif text-2xl leading-snug text-[#f4f0e7]">
                The math is fixed. The interpretation is a frame. You keep what clarifies.
              </p>
            </article>
          </div>
        </section>

        <section className="relative z-10 px-5 py-16 sm:px-8 lg:px-10">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.82fr_1.18fr]">
            <div className="border border-[#14110d]/18 bg-[#f4f0e7]/78 p-6 sm:p-8">
              <p className="oracle-eyebrow">card blueprints</p>
              <h2 className="mt-4 font-serif text-4xl leading-none sm:text-5xl">
                The Card Blueprint is the deeper product.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-[#5b5148] sm:text-lg">
                A Card Blueprint turns the fixed structure into a fuller pattern map. It is for people who want more than a card name without pretending the system proves who they are.
              </p>
              <a href={`${APP_URL}/onboarding`} className="ink-button large-button mt-7">
                Get a Card Blueprint <span aria-hidden="true">→</span>
              </a>
            </div>

            <div className="grid gap-px overflow-hidden border border-[#14110d]/15 bg-[#14110d]/15 sm:grid-cols-2">
              {blueprintItems.map((item) => (
                <article key={item.label} className="bg-[#f4f0e7] p-5 sm:p-6">
                  <h3 className="font-serif text-2xl">{item.label}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#5b5148]">{item.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative z-10 bg-[#14110d] px-5 py-16 text-[#f4f0e7] sm:px-8 lg:px-10">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="oracle-eyebrow text-[#c8bca8]">why this exists</p>
              <h2 className="mt-4 max-w-lg font-serif text-4xl leading-[0.98] sm:text-5xl">
                The system is too rich to throw away and too easy to overclaim.
              </h2>
            </div>
            <div className="space-y-5 text-base leading-relaxed text-[#d7cdbc] sm:text-lg">
              <p>
                Cass was told at five years old that he was the Eight of Diamonds in the Crown Line. He spent decades living inside the symbols, then years reverse-engineering the structure underneath them.
              </p>
              <p>
                That kind of mastery matters. It still does not prove that cardology predicts your life.
              </p>
              <p>
                So Cardology Pro takes the harder lane: show the math, name the limits, and let the reading stand or fall by whether it clarifies something real.
              </p>
            </div>
          </div>
        </section>

        <section className="relative z-10 px-5 py-16 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-4xl border border-[#14110d]/18 bg-[#f4f0e7]/82 p-6 text-center shadow-[0_1.5rem_4rem_rgba(20,17,13,0.1)] sm:p-10">
            <p className="oracle-eyebrow">start free</p>
            <h2 className="mt-4 font-serif text-4xl leading-none sm:text-6xl">
              Find your birth card. Upgrade only if the mirror is useful.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#5b5148] sm:text-lg">
              No blind test has validated the symbolic meanings of cardology. That does not make the structure useless. It makes honesty part of the product.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/birth-card-calculator" className="ink-button large-button">
                Find your birth card
              </Link>
              <a href={`${APP_URL}/onboarding`} className="paper-button large-button">
                Get the Card Blueprint
              </a>
            </div>
          </div>
        </section>

        <footer className="relative z-10 mx-auto w-full max-w-7xl px-5 py-12 sm:px-8 lg:px-10">
          <p className="oracle-eyebrow mb-5 text-[#14110d]/60">Explore the system</p>
          <div className="grid gap-8 text-sm text-[#3d352d] sm:grid-cols-3">
            <div>
              <p className="mb-2 font-serif text-base text-[#14110d]">Start here</p>
              <ul className="space-y-1.5">
                <li><Link href="/birth-card-calculator" className="hover:text-[#14110d]">Birth Card Calculator</Link></li>
                <li><a href={`${APP_URL}/onboarding`} className="hover:text-[#14110d]">Card Blueprint</a></li>
                <li><Link href="/birth-card" className="hover:text-[#14110d]">All 52 Birth Card Meanings</Link></li>
                <li><Link href="/52-day-period-meaning-tool" className="hover:text-[#14110d]">52-Day Period Meaning Tool</Link></li>
                <li><Link href="/what-is-cardology" className="hover:text-[#14110d]">What Is Cardology?</Link></li>
                <li><Link href="/52-card-astrology-explained" className="hover:text-[#14110d]">52-Card Astrology, Explained</Link></li>
              </ul>
            </div>
            <div>
              <p className="mb-2 font-serif text-base text-[#14110d]">Go deeper</p>
              <ul className="space-y-1.5">
                <li><Link href="/birth-card-vs-ruling-card" className="hover:text-[#14110d]">Birth Card vs Ruling Card</Link></li>
                <li><Link href="/cardology-compatibility" className="hover:text-[#14110d]">Cardology Compatibility</Link></li>
                <li><Link href="/birth-card-compatibility-calculator" className="hover:text-[#14110d]">Compatibility Calculator</Link></li>
                <li><Link href="/cardology-agent-instructions" className="hover:text-[#14110d]">Shadow &amp; Karma Guide</Link></li>
              </ul>
            </div>
            <div>
              <p className="mb-2 font-serif text-base text-[#14110d]">Popular cards</p>
              <ul className="space-y-1.5">
                <li><Link href="/birth-card/queen-of-hearts" className="hover:text-[#14110d]">Queen of Hearts</Link></li>
                <li><Link href="/birth-card/ace-of-spades" className="hover:text-[#14110d]">Ace of Spades</Link></li>
                <li><Link href="/birth-card/king-of-diamonds" className="hover:text-[#14110d]">King of Diamonds</Link></li>
                <li><Link href="/birth-card/8-of-diamonds" className="hover:text-[#14110d]">8 of Diamonds</Link></li>
              </ul>
            </div>
          </div>
          <p className="mt-8 text-xs leading-relaxed text-[#5b5148]">
            Calculated from the deterministic Cardology system. Same birthday, same card, every time. A mirror for noticing patterns, not a forecast.
          </p>
        </footer>
      </main>
    </>
  );
}
