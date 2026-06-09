import Link from "next/link";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { ReturningUserRedirect } from "@/components/seo/ReturningUserRedirect";
import { APP_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "Cardology Pro Life Pattern Report — $29" },
  description:
    "Get your Cardology Pro Life Pattern Report for $29, including the report, one month of Daily Card Pattern Pro, the card comparison tool, daily mirror prompts, and journal access.",
  alternates: { canonical: "/" },
};

const offerItems = [
  {
    label: "Life Pattern Report",
    detail: "Your birth-card pattern in writing — strengths, the shadow you keep explaining away, and the timing language behind your worst weeks.",
  },
  {
    label: "1 month Daily Card Pattern Pro",
    detail: "Come back each morning to the card running the day — and the exact way you're about to overplay it.",
  },
  {
    label: "Card Comparison Tool",
    detail: "Run your cards against someone else's: attraction, friction, and the specific way you two will drive each other up a wall.",
  },
  {
    label: "Daily Mirror Prompt + Journal",
    detail: "One pointed prompt a day, and a private place to admit you saw it coming.",
  },
];

const cardStack = ["A♠", "7♥", "Q♦", "3♣", "9♠"];

export default function Home() {
  return (
    <>
      <ReturningUserRedirect />
      <main className="landing-oracle relative min-h-dvh overflow-hidden bg-[#f4f0e7] text-[#14110d]">
        <div className="oracle-grid" aria-hidden="true" />
        <div className="oracle-noise" aria-hidden="true" />

        <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between border-b border-[#14110d]/15 px-5 py-4 sm:px-8 lg:px-10">
          <Link href="/" className="brand-mark" aria-label="Cardology Pro home">
            Cardology Pro
          </Link>
          <nav className="hidden items-center gap-6 text-[0.66rem] uppercase tracking-[0.24em] text-[#14110d]/70 md:flex">
            <Link href="/birth-card-calculator" className="transition hover:text-[#14110d]">Find Your Card</Link>
            <Link href="/cardology-compatibility" className="transition hover:text-[#14110d]">Compare</Link>
            <a href={`${APP_URL}/journal`} className="transition hover:text-[#14110d]">Journal</a>
          </nav>
          <a href={`${APP_URL}/onboarding`} className="ink-button small-button">
            Get the report
          </a>
        </header>

        <section className="relative z-10 mx-auto grid min-h-[calc(100dvh-69px)] w-full max-w-7xl items-center gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:px-10 lg:py-14">
          <div className="max-w-3xl">
            <p className="oracle-eyebrow animate-[fade-up_0.7s_cubic-bezier(0.22,1,0.36,1)_both]">
              a 52-card mirror that won't flatter you / limited launch
            </p>

            <h1 className="hero-title mt-5 animate-[fade-up_0.7s_cubic-bezier(0.22,1,0.36,1)_0.08s_both]">
              Cardology Pro <span>Life Pattern Report</span>
            </h1>

            <div className="mt-6 flex flex-wrap items-end gap-4 animate-[fade-up_0.7s_cubic-bezier(0.22,1,0.36,1)_0.16s_both]">
              <div className="price-sigil" aria-label="Price $29">
                <span>$</span>29
              </div>
              <p className="max-w-xl text-pretty font-serif text-xl leading-relaxed text-[#3d352d] sm:text-2xl">
                A birth-card report built like a private field guide to your own patterns:
                shadow, relationship friction, daily prompts, and a month of Card Pattern Pro.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3 animate-[fade-up_0.7s_cubic-bezier(0.22,1,0.36,1)_0.24s_both] sm:flex-row">
              <a href={`${APP_URL}/onboarding`} className="ink-button large-button">
                Start my $29 report <span aria-hidden="true">→</span>
              </a>
              <Link href="/birth-card-calculator" className="paper-button large-button">
                Find my card first
              </Link>
            </div>

            <p className="mt-5 max-w-xl text-sm leading-relaxed text-[#5b5148] animate-[fade-up_0.7s_cubic-bezier(0.22,1,0.36,1)_0.32s_both]">
              Not a forecast. Not vibes. Your birthday maps to exactly one card, every time — and the report turns that pattern into something you can actually catch yourself doing, compare, and journal about.
            </p>
          </div>

          <aside className="hero-instrument animate-[fade-up_0.8s_cubic-bezier(0.22,1,0.36,1)_0.18s_both]" aria-label="Included in the $29 offer">
            <div className="instrument-face">
              <div className="instrument-topline">
                <span>offer contains</span>
                <strong>$29</strong>
              </div>

              <div className="card-orbit" aria-hidden="true">
                {cardStack.map((card, index) => (
                  <span key={card} style={{ "--i": index } as CSSProperties}>
                    {card}
                  </span>
                ))}
              </div>

              <div className="report-slip">
                <p className="slip-kicker">Life Pattern Report</p>
                <p className="slip-title">Your card, read back without the flattery.</p>
                <div className="slip-lines" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </div>
              </div>

              <ul className="offer-list">
                {offerItems.map((item, index) => (
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
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="oracle-eyebrow text-[#c8bca8]">why it works</p>
              <h2 className="mt-4 max-w-lg font-serif text-4xl leading-[0.98] tracking-[-0.03em] sm:text-5xl">
                One report. Thirty days of catching yourself in the act.
              </h2>
            </div>
            <div className="grid gap-px overflow-hidden border border-[#f4f0e7]/20 bg-[#f4f0e7]/20 sm:grid-cols-2">
              {offerItems.map((item) => (
                <article key={item.label} className="bg-[#14110d] p-6">
                  <h3 className="font-serif text-2xl tracking-[-0.02em]">{item.label}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#d7cdbc]">{item.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
