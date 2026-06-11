import Link from "next/link";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { APP_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "Cardology Pro — Birth Card Meanings, Calculator & Life Pattern Report" },
  description:
    "Cardology Pro is a structured self-reflection instrument built on deterministic cardology math: same birth date, same card structure, no randomness, no forecast claims.",
  alternates: { canonical: "/" },
};

const proofPoints = [
  "same birth date, same card structure",
  "open method that can be shown and checked",
  "no random draw at the math layer",
  "no reader-dependent result changes",
];

const reflectionFrames = [
  "how you handle pressure",
  "where you tend to overgive or withhold",
  "what kinds of decisions repeat",
  "how work, money, love, timing, and self-trust show up as reflection prompts",
  "what you may already know but have not had language for yet",
];

const blueprintItems = [
  {
    label: "Core card structure",
    detail: "The fixed cards and positions generated from your birth date, presented as a clear symbolic frame.",
  },
  {
    label: "Challenge patterns",
    detail: "Where the frame points your attention when pressure, repetition, or self-protection starts running the room.",
  },
  {
    label: "Support patterns",
    detail: "The strengths, stabilizers, and practical questions you can use without pretending the system proves anything about you.",
  },
  {
    label: "Cycle frames",
    detail: "Timing language for reflection — not prediction, not certainty, not manufactured stakes.",
  },
];

const notClaims = [
  "predict your future",
  "prove your destiny",
  "reveal your true self",
  "diagnose your personality",
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
          <nav className="hidden items-center gap-6 text-[0.66rem] uppercase tracking-[0.24em] text-[#14110d]/70 md:flex">
            <Link href="/birth-card-calculator" className="transition hover:text-[#14110d]">
              Find Your Card
            </Link>
            <Link href="/what-is-cardology" className="transition hover:text-[#14110d]">
              The Method
            </Link>
            <Link href="/52-card-astrology-explained" className="transition hover:text-[#14110d]">
              Honest Answer
            </Link>
          </nav>
          <a href={`${APP_URL}/onboarding`} className="ink-button small-button">
            Get a blueprint
          </a>
        </header>

        <section className="relative z-10 mx-auto grid min-h-[calc(100dvh-69px)] w-full max-w-7xl items-center gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[1.03fr_0.97fr] lg:px-10 lg:py-14">
          <div className="max-w-3xl">
            <p className="oracle-eyebrow animate-[fade-up_0.7s_cubic-bezier(0.22,1,0.36,1)_both]">
              structured self-reflection / deterministic math
            </p>

            <h1 className="hero-title mt-5 animate-[fade-up_0.7s_cubic-bezier(0.22,1,0.36,1)_0.08s_both]">
              Mirror, <span>not forecast.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-pretty font-serif text-2xl leading-relaxed text-[#3d352d] animate-[fade-up_0.7s_cubic-bezier(0.22,1,0.36,1)_0.16s_both] sm:text-3xl">
              Every birth date maps to a fixed card structure. Same input. Same output. No randomness. No theater.
            </p>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#5b5148] animate-[fade-up_0.7s_cubic-bezier(0.22,1,0.36,1)_0.22s_both] sm:text-lg">
              Cardology Pro uses the 90-year spread system as a structured self-reflection instrument. The math is reproducible. The meanings are yours to judge.
            </p>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#5b5148] animate-[fade-up_0.7s_cubic-bezier(0.22,1,0.36,1)_0.28s_both] sm:text-lg">
              This is not here to tell you who you are. It is here to give you a mirror clear enough to argue with.
            </p>

            <div className="mt-8 flex flex-col gap-3 animate-[fade-up_0.7s_cubic-bezier(0.22,1,0.36,1)_0.34s_both] sm:flex-row">
              <Link href="/birth-card-calculator" className="ink-button large-button">
                Find your birth card <span aria-hidden="true">→</span>
              </Link>
              <a href={`${APP_URL}/onboarding`} className="paper-button large-button">
                Get a Card Blueprint
              </a>
            </div>
          </div>

          <aside className="hero-instrument animate-[fade-up_0.8s_cubic-bezier(0.22,1,0.36,1)_0.18s_both]" aria-label="Cardology Pro mirror principles">
            <div className="instrument-face">
              <div className="instrument-topline">
                <span>mirror / not forecast</span>
                <strong>just math</strong>
              </div>

              <div className="card-orbit" aria-hidden="true">
                {cardStack.map((card, index) => (
                  <span key={card} style={{ "--i": index } as CSSProperties}>
                    {card}
                  </span>
                ))}
              </div>

              <div className="report-slip">
                <p className="slip-kicker">Cardology Pro</p>
                <p className="slip-title">A mirror with visible machinery.</p>
                <div className="slip-lines" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </div>
              </div>

              <ul className="offer-list">
                {proofPoints.map((item, index) => (
                  <li key={item} style={{ "--delay": `${0.28 + index * 0.08}s` } as CSSProperties}>
                    <span className="offer-count">0{index + 1}</span>
                    <span>
                      <strong>{item}</strong>
                      <small>The calculation can be re-run. The reflection is yours to test.</small>
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
              <p className="oracle-eyebrow text-[#c8bca8]">a symbolic system that shows its work</p>
              <h2 className="mt-4 max-w-xl font-serif text-4xl leading-[0.98] tracking-[-0.03em] sm:text-5xl">
                Most personality systems ask you to trust the result.
              </h2>
            </div>
            <div className="space-y-5 text-base leading-relaxed text-[#d7cdbc] sm:text-lg">
              <p>
                Cardology Pro starts somewhere simpler: the calculation. Every birth date maps to one of 52 cards. That mapping is fixed. It can be shown, checked, and re-run.
              </p>
              <p>
                No random draw. No changing interpretation because of who is reading. No mystical fog around the math.
              </p>
              <p className="font-serif text-2xl leading-snug text-[#f4f0e7]">
                That part is just arithmetic. What the structure means in your life is not something we pretend to prove. That part is the mirror.
              </p>
            </div>
          </div>
        </section>

        <section className="relative z-10 px-5 py-16 sm:px-8 lg:px-10">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
            <article className="border border-[#14110d]/18 bg-[#f4f0e7]/74 p-6 shadow-[0_1.5rem_4rem_rgba(20,17,13,0.08)] sm:p-8">
              <p className="oracle-eyebrow">what this is</p>
              <h2 className="mt-4 font-serif text-4xl leading-none tracking-[-0.04em] sm:text-5xl">
                A card-based frame for reflection.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-[#5b5148] sm:text-lg">
                Cardology Pro takes your birth date, runs it through a fixed symbolic system, and returns a structure you can think with.
              </p>
              <ul className="mt-6 grid gap-3 text-sm leading-relaxed text-[#3d352d] sm:text-base">
                {reflectionFrames.map((item) => (
                  <li key={item} className="border-t border-[#14110d]/12 pt-3">
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-6 font-serif text-2xl leading-snug text-[#14110d]">
                It does not hand you certainty. It gives you structure. Sometimes structure is enough to see yourself more clearly.
              </p>
            </article>

            <article className="border border-[#14110d]/18 bg-[#14110d] p-6 text-[#f4f0e7] shadow-[0_1.5rem_4rem_rgba(20,17,13,0.13)] sm:p-8">
              <p className="oracle-eyebrow text-[#c8bca8]">what this is not</p>
              <h2 className="mt-4 font-serif text-4xl leading-none tracking-[-0.04em] sm:text-5xl">
                Not a fortune-telling machine.
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
                Nobody in this market likes saying that part out loud. We do. Because trust is the product.
              </p>
            </article>
          </div>
        </section>

        <section className="relative z-10 border-y border-[#14110d]/15 bg-[#eadfcd] px-5 py-16 sm:px-8 lg:px-10">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="oracle-eyebrow">the math is real. the meaning is yours.</p>
              <h2 className="mt-4 max-w-xl font-serif text-4xl leading-[0.98] tracking-[-0.04em] sm:text-6xl">
                Precision of calculation is not proof of interpretation.
              </h2>
            </div>
            <div className="space-y-5 text-base leading-relaxed text-[#4c4339] sm:text-lg">
              <p>
                That is the sleight of hand hiding inside a lot of astrology, numerology, and symbolic systems.
              </p>
              <p>
                Cardology Pro refuses that move. The math is fixed and reproducible. The reading is a frame.
              </p>
              <p>
                You bring your life to it. You test it against what you actually know. You keep what clarifies. You leave what does not.
              </p>
              <p className="font-serif text-3xl leading-snug text-[#14110d]">
                That is how a mirror works.
              </p>
            </div>
          </div>
        </section>

        <section className="relative z-10 px-5 py-16 sm:px-8 lg:px-10">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="border border-[#14110d]/18 bg-[#f4f0e7]/78 p-6 sm:p-8">
              <p className="oracle-eyebrow">start with your birth card</p>
              <h2 className="mt-4 font-serif text-4xl leading-none tracking-[-0.04em] sm:text-5xl">
                Your first fixed point in the system.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-[#5b5148] sm:text-lg">
                Enter your birth date and Cardology Pro will show the card assigned to that date. From there, you can explore the basic meaning or order a deeper Card Blueprint.
              </p>
              <Link href="/birth-card-calculator" className="ink-button large-button mt-7">
                Find your birth card <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div className="border border-[#14110d]/18 bg-[#f4f0e7]/78 p-6 sm:p-8">
              <p className="oracle-eyebrow">card blueprints</p>
              <h2 className="mt-4 font-serif text-4xl leading-none tracking-[-0.04em] sm:text-5xl">
                A written reading without borrowed authority.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-[#5b5148] sm:text-lg">
                A Card Blueprint is a written reading generated from your fixed card structure. Not a prediction. Not a destiny report. Not “the universe has a message for you.”
              </p>
              <div className="mt-6 grid gap-px overflow-hidden border border-[#14110d]/15 bg-[#14110d]/15 sm:grid-cols-2">
                {blueprintItems.map((item) => (
                  <article key={item.label} className="bg-[#f4f0e7] p-5">
                    <h3 className="font-serif text-2xl tracking-[-0.03em]">{item.label}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#5b5148]">{item.detail}</p>
                  </article>
                ))}
              </div>
              <a href={`${APP_URL}/onboarding`} className="ink-button large-button mt-7">
                Get a Card Blueprint <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </section>

        <section className="relative z-10 bg-[#14110d] px-5 py-16 text-[#f4f0e7] sm:px-8 lg:px-10">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="oracle-eyebrow text-[#c8bca8]">why this exists</p>
              <h2 className="mt-4 max-w-lg font-serif text-4xl leading-[0.98] tracking-[-0.04em] sm:text-5xl">
                The system is too rich to throw away and too easy to overclaim.
              </h2>
            </div>
            <div className="space-y-5 text-base leading-relaxed text-[#d7cdbc] sm:text-lg">
              <p>
                Cass was told at five years old that he was the Eight of Diamonds in the Crown Line. He spent decades living inside the symbols, then years reverse-engineering the structure underneath them.
              </p>
              <p>
                That kind of mastery is real. But mastery of a system does not prove the system predicts your life.
              </p>
              <p>
                A chess master understands chess deeply. That does not mean chess predicts the future.
              </p>
              <p className="font-serif text-3xl leading-snug text-[#f4f0e7]">
                So Cardology Pro takes the harder path: show the math, name the limits, sell the mirror.
              </p>
            </div>
          </div>
        </section>

        <section className="relative z-10 px-5 py-16 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-4xl border border-[#14110d]/18 bg-[#f4f0e7]/82 p-6 text-center shadow-[0_1.5rem_4rem_rgba(20,17,13,0.1)] sm:p-10">
            <p className="oracle-eyebrow">the honest disclaimer</p>
            <h2 className="mt-4 font-serif text-4xl leading-none tracking-[-0.04em] sm:text-6xl">
              No blind test has validated the symbolic meanings of cardology.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#5b5148] sm:text-lg">
              Ours included. That does not make the structure useless. It makes it honest.
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#5b5148] sm:text-lg">
              Cardology Pro calculates a fixed symbolic frame from your birth date. What that frame reflects back to you is yours to judge.
            </p>
            <p className="mt-7 font-serif text-3xl leading-snug text-[#14110d]">
              Mirror, not forecast. Just math.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/birth-card-calculator" className="ink-button large-button">
                Find your birth card
              </Link>
              <a href={`${APP_URL}/onboarding`} className="paper-button large-button">
                Get a Card Blueprint
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
                <li><Link href="/birth-card" className="hover:text-[#14110d]">All 52 Birth Card Meanings</Link></li>
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
