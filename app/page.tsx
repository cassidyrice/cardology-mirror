import Link from "next/link";
import type { CSSProperties } from "react";
import type { Metadata } from "next";

import { VIDEO_PATH } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "Cardology Pro - Birth Card Calculator, Meanings and Compatibility" },
  description:
    "Find your Cardology birth card, browse all 52 card meanings, read educational guides, watch videos, compare compatibility, and learn the 52-card astrology system. Mirror, not forecast.",
  alternates: { canonical: "/" },
};

const proofPoints = [
  {
    label: "birth card calculator",
    detail: "Enter a birth date and get the fixed Cardology birth card and ruling-card context.",
  },
  {
    label: "all 52 card meanings",
    detail: "Browse searchable pages for every card, from Ace of Spades to King of Diamonds.",
  },
  {
    label: "compatibility tools",
    detail: "Compare two cards and read relationship themes without treating the result as fate.",
  },
  {
    label: "timing references",
    detail: "Use 52-day period language as a reflection frame, not a forecast.",
  },
];

const pathSteps = [
  {
    label: "01",
    title: "Calculate the birth card.",
    detail:
      "Start with the birthday question. Same input, same Cardology structure, every time.",
  },
  {
    label: "02",
    title: "Read the meaning.",
    detail:
      "Move from the calculator into a public meaning page for the birth card, ruling card, and card language.",
  },
  {
    label: "03",
    title: "Explore timing and compatibility.",
    detail:
      "Use the compatibility and 52-day period tools when the next question is about relationships or timing.",
  },
];

const reflectionFrames = [
  "the card your birthday maps to in the 52-card calendar",
  "how birth card and ruling card language differ",
  "relationship patterns shown by two-card comparisons",
  "what each 52-day period can frame for reflection",
  "where Cardology is useful, limited, or easy to overclaim",
];

const searchEntryPoints = [
  {
    label: "Birth Card Calculator",
    href: "/birth-card-calculator",
    detail: "Find the fixed card assigned to a birthday and move directly into the matching meaning page.",
  },
  {
    label: "All 52 Birth Cards",
    href: "/birth-card",
    detail: "Browse the full searchable Cardology birth-card directory by rank, suit, and card name.",
  },
  {
    label: "Cardology Blog",
    href: "/blog",
    detail: "Read educational guides organized by foundations, card meanings, timing, compatibility, and practice.",
  },
  {
    label: "Cardology Videos",
    href: VIDEO_PATH,
    detail: "Watch Cardology Pro video explainers and shadow-reading films for cards, timing, and self-reflection.",
  },
  {
    label: "Compatibility Calculator",
    href: "/birth-card-compatibility-calculator",
    detail: "Compare two birth cards and read the relationship pattern without turning it into destiny.",
  },
  {
    label: "52-Day Period Tool",
    href: "/52-day-period-meaning-tool",
    detail: "Look up the current card period as timing language for reflection, not prediction.",
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
          <nav className="hidden items-center gap-4 text-[0.68rem] uppercase text-[#14110d]/70 lg:flex xl:gap-5 xl:text-[0.72rem]">
            <Link href="/birth-card-calculator" className="transition hover:text-[#14110d]">
              Calculator
            </Link>
            <Link href="/birth-card" className="transition hover:text-[#14110d]">
              Card Meanings
            </Link>
            <Link href="/blog" className="transition hover:text-[#14110d]">
              Blog
            </Link>
            <Link href={VIDEO_PATH} className="transition hover:text-[#14110d]">
              Videos
            </Link>
            <Link href="/cardology-compatibility" className="transition hover:text-[#14110d]">
              Compatibility
            </Link>
            <Link href="/52-day-period-meaning-tool" className="transition hover:text-[#14110d]">
              Period Tool
            </Link>
            <Link href="/what-is-cardology" className="transition hover:text-[#14110d]">
              The Method
            </Link>
          </nav>
          <Link href="/birth-card-calculator" className="ink-button small-button">
            Find Your Card
          </Link>
        </header>

        <section className="relative z-10 mx-auto grid min-h-[calc(100dvh-69px)] w-full max-w-7xl items-start gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[1.03fr_0.97fr] lg:px-10">
          <div className="max-w-3xl">
            <p className="oracle-eyebrow animate-[fade-up_0.7s_cubic-bezier(0.22,1,0.36,1)_both]">
              birth card calculator / meanings / compatibility
            </p>

            <h1 className="hero-title mt-5 animate-[fade-up_0.7s_cubic-bezier(0.22,1,0.36,1)_0.08s_both]">
              Cardology birth card <span>calculator and meanings.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-pretty font-serif text-2xl leading-relaxed text-[#3d352d] animate-[fade-up_0.7s_cubic-bezier(0.22,1,0.36,1)_0.16s_both] sm:text-3xl">
              Find the card your birthday maps to, read its meaning, compare compatibility, and use 52-card astrology as a practical mirror.
            </p>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#5b5148] animate-[fade-up_0.7s_cubic-bezier(0.22,1,0.36,1)_0.22s_both] sm:text-lg">
              Same birthday, same card structure; no draw, forecast, or borrowed certainty. Cardology Pro is organized around the questions people actually search: what card am I, what does it mean, and how do two cards relate?
            </p>

            <div className="mt-7 flex flex-col gap-3 animate-[fade-up_0.7s_cubic-bezier(0.22,1,0.36,1)_0.28s_both] sm:flex-row">
              <Link href="/birth-card-calculator" className="ink-button large-button">
                Find your birth card <span aria-hidden="true">→</span>
              </Link>
              <Link href="/birth-card" className="paper-button large-button">
                Browse all 52 cards
              </Link>
            </div>
          </div>

          <aside className="hero-instrument animate-[fade-up_0.8s_cubic-bezier(0.22,1,0.36,1)_0.18s_both]" aria-label="Cardology Pro mirror principles">
            <div className="instrument-face">
              <div className="instrument-topline">
                <span>calculator / meanings / method</span>
                <strong>searchable Cardology</strong>
              </div>

              <div className="card-orbit" aria-hidden="true">
                {cardStack.map((card, index) => (
                  <span key={card} style={{ "--i": index } as CSSProperties}>
                    {card}
                  </span>
                ))}
              </div>

              <div className="report-slip">
                <p className="slip-kicker">Cardology reference</p>
                <p className="slip-title">Calculator, meanings, compatibility, and timing in one public guide.</p>
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
              <p className="oracle-eyebrow text-[#c8bca8]">one public purpose</p>
              <h2 className="mt-4 max-w-xl font-serif text-4xl leading-[0.98] sm:text-5xl">
                Make Cardology Pro the place people land when they search a card question.
              </h2>
            </div>
            <div className="space-y-5 text-base leading-relaxed text-[#d7cdbc] sm:text-lg">
              <p>
                Most people arrive through a search: what is my birth card, what does Queen of Hearts mean, are these two cards compatible, or what is a 52-day period?
              </p>
              <p>
                Cardology Pro should answer those questions in one consistent public site. The app can exist for deeper personal work, but the searchable experience starts with calculators, meanings, compatibility, timing, and method pages.
              </p>
              <p className="font-serif text-2xl leading-snug text-[#f4f0e7]">
                Not a prophecy. Not a personality test wearing a costume. A structured mirror with visible machinery.
              </p>
            </div>
          </div>
        </section>

        <section className="relative z-10 px-5 py-16 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <p className="oracle-eyebrow">from search to understanding</p>
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
              <p className="oracle-eyebrow">searchable site map</p>
              <h2 className="mt-4 font-serif text-4xl leading-none sm:text-5xl">
                Every core question should have a clear public path.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-[#5b5148] sm:text-lg">
                The site now points visitors to the pages that match how they actually search: calculator, card meanings, compatibility, timing, and the plain-English method.
              </p>
              <Link href="/birth-card" className="ink-button large-button mt-7">
                Browse card meanings <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div className="grid gap-px overflow-hidden border border-[#14110d]/15 bg-[#14110d]/15 sm:grid-cols-2">
              {searchEntryPoints.map((item) => (
                <Link key={item.label} href={item.href} className="block bg-[#f4f0e7] p-5 transition hover:bg-[#fffaf0] sm:p-6">
                  <h3 className="font-serif text-2xl">{item.label}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#5b5148]">{item.detail}</p>
                </Link>
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
            <p className="oracle-eyebrow">start with the question</p>
            <h2 className="mt-4 font-serif text-4xl leading-none sm:text-6xl">
              Find your birth card, then follow the question it raises.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#5b5148] sm:text-lg">
              The public site is the main path: calculator, meanings, compatibility, timing, and honest method pages. Deeper app screens stay secondary to the search experience.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/birth-card-calculator" className="ink-button large-button">
                Find your birth card
              </Link>
              <Link href="/cardology-compatibility" className="paper-button large-button">
                Explore compatibility
              </Link>
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
                <li><Link href="/blog" className="hover:text-[#14110d]">Cardology Blog</Link></li>
                <li><Link href={VIDEO_PATH} className="hover:text-[#14110d]">Cardology Videos</Link></li>
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
                <li><Link href="/shadow-karma-guide" className="hover:text-[#14110d]">Shadow &amp; Karma Guide</Link></li>
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
