import Link from "next/link";
import type { CSSProperties } from "react";
import type { Metadata } from "next";

import { READING_OFFERS, readingOfferHref } from "@/lib/products";
import { READINGS_PATH, SITE_URL, VIDEO_PATH } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "Cardology Readings and Birth Card Calculator | Cardology Pro" },
  description:
    "Personal Cardology readings from your birth card: a $29 birth card report, $99 one-question reading, or $199 full deep dive. Start free with the birth card calculator, all 52 card meanings, and compatibility tools.",
  alternates: { canonical: "/" },
};

const buySteps = [
  {
    label: "01",
    title: "Pick the reading.",
    detail:
      "The $29 report maps one person. The $99 reading answers one real question. The $199 deep dive maps the whole pattern. Checkout takes a minute.",
  },
  {
    label: "02",
    title: "Send the details.",
    detail:
      "Right after payment you confirm the birth date, the person or relationship involved, and the question you actually want answered.",
  },
  {
    label: "03",
    title: "Read the answer.",
    detail:
      "You get a written reading by email — birth card, ruling card, shadow range, timing when it matters — in plain language about your situation.",
  },
];

const freeTools = [
  {
    label: "Birth Card Calculator",
    href: "/birth-card-calculator",
    detail: "Enter a birthday, get the fixed birth card and ruling card. The place every reading starts.",
  },
  {
    label: "All 52 Birth Cards",
    href: "/birth-card",
    detail: "Every card meaning, from Ace of Hearts to King of Spades, written as a real pattern in people.",
  },
  {
    label: "Compatibility Calculator",
    href: "/birth-card-compatibility-calculator",
    detail: "Compare two birthdays and see where the attraction, friction, and shared weather actually live.",
  },
  {
    label: "52-Day Period Tool",
    href: "/52-day-period-meaning-tool",
    detail: "Run any card through the seven yearly period filters and learn the timing language.",
  },
  {
    label: "Cardology Blog",
    href: "/blog",
    detail: "Guides for suits, ranks, karma cards, famous-person profiles, and recurring dynamics.",
  },
  {
    label: "Cardology Videos",
    href: VIDEO_PATH,
    detail: "Shadow-reading films and explainers for cards, people, and relationship patterns.",
  },
];

const cardStack = ["A♠", "7♥", "Q♦", "3♣", "9♠"];

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Cardology Pro personal readings",
    itemListElement: READING_OFFERS.map((offer, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: offer.name,
      url: `${SITE_URL}${READINGS_PATH}#${offer.slug}`,
    })),
  };

  return (
    <>
      <main className="landing-oracle relative min-h-dvh overflow-hidden bg-[#f4f0e7] text-[#14110d]">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <div className="oracle-grid" aria-hidden="true" />
        <div className="oracle-noise" aria-hidden="true" />

        <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between border-b border-[#14110d]/15 px-5 py-4 sm:px-8 lg:px-10">
          <Link href="/" className="brand-mark" aria-label="Cardology Pro home">
            Cardology Pro
          </Link>
          <nav className="hidden items-center gap-4 text-[0.68rem] uppercase text-[#14110d]/70 lg:flex xl:gap-5 xl:text-[0.72rem]">
            <Link href={READINGS_PATH} className="font-bold text-[#9e3d24] transition hover:text-[#14110d]">
              Readings
            </Link>
            <Link href="/birth-card-calculator" className="transition hover:text-[#14110d]">
              Calculator
            </Link>
            <Link href="/birth-card" className="transition hover:text-[#14110d]">
              Card Meanings
            </Link>
            <Link href="/cardology-compatibility" className="transition hover:text-[#14110d]">
              Compatibility
            </Link>
            <Link href="/52-day-period-meaning-tool" className="transition hover:text-[#14110d]">
              Timing
            </Link>
            <Link href="/blog" className="transition hover:text-[#14110d]">
              Blog
            </Link>
            <Link href="/what-is-cardology" className="transition hover:text-[#14110d]">
              The Method
            </Link>
          </nav>
          <Link href={READINGS_PATH} className="ink-button small-button">
            Get a Reading
          </Link>
        </header>

        <section className="relative z-10 mx-auto grid min-h-[calc(100dvh-69px)] w-full max-w-7xl items-start gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[1.03fr_0.97fr] lg:px-10">
          <div className="max-w-3xl">
            <p className="oracle-eyebrow animate-[fade-up_0.7s_cubic-bezier(0.22,1,0.36,1)_both]">
              $29 report / $99 one-question reading / $199 deep dive
            </p>

            <h1 className="hero-title mt-5 animate-[fade-up_0.7s_cubic-bezier(0.22,1,0.36,1)_0.08s_both]">
              Personal Cardology readings <span>from your birth card.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-pretty font-serif text-2xl leading-relaxed text-[#3d352d] animate-[fade-up_0.7s_cubic-bezier(0.22,1,0.36,1)_0.16s_both] sm:text-3xl">
              Bring a birth date and a real question. Get a written reading about
              the actual person, relationship, or decision — not a horoscope.
            </p>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#5b5148] animate-[fade-up_0.7s_cubic-bezier(0.22,1,0.36,1)_0.22s_both] sm:text-lg">
              Cardology is deterministic: same birthday, same card, every time.
              Find your card free with the birth card calculator, then have it
              read for your life — love, family, work, money, timing, and the
              dynamics that keep repeating.
            </p>

            <div className="mt-7 flex flex-col gap-3 animate-[fade-up_0.7s_cubic-bezier(0.22,1,0.36,1)_0.28s_both] sm:flex-row">
              <Link href={READINGS_PATH} className="ink-button large-button">
                Choose your reading <span aria-hidden="true">→</span>
              </Link>
              <Link href="/birth-card-calculator" className="paper-button large-button">
                Find your card free
              </Link>
            </div>
          </div>

          <aside className="hero-instrument animate-[fade-up_0.8s_cubic-bezier(0.22,1,0.36,1)_0.18s_both]" aria-label="Cardology Pro reading options">
            <div className="instrument-face">
              <div className="instrument-topline">
                <span>written / personal / deterministic</span>
                <strong>the reading ladder</strong>
              </div>

              <div className="card-orbit" aria-hidden="true">
                {cardStack.map((card, index) => (
                  <span key={card} style={{ "--i": index } as CSSProperties}>
                    {card}
                  </span>
                ))}
              </div>

              <div className="report-slip">
                <p className="slip-kicker">Delivered by email</p>
                <p className="slip-title">One card. One question. One written answer.</p>
                <div className="slip-lines" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </div>
              </div>

              <ul className="offer-list">
                {READING_OFFERS.map((offer, index) => (
                  <li key={offer.slug} style={{ "--delay": `${0.28 + index * 0.08}s` } as CSSProperties}>
                    <span className="offer-count">{offer.priceLabel}</span>
                    <span>
                      <strong>{offer.name}</strong>
                      <small>{offer.oneLine}</small>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </section>

        <section className="relative z-10 border-y border-[#14110d]/15 bg-[#eadfcd] px-5 py-16 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
              <div>
                <p className="oracle-eyebrow">the readings</p>
                <h2 className="mt-4 max-w-xl font-serif text-4xl leading-none sm:text-5xl">
                  Three readings. One clear ladder.
                </h2>
                <p className="mt-5 text-base leading-relaxed text-[#5b5148] sm:text-lg">
                  Start with one person&rsquo;s card. Move up when there is a real
                  question on the table. Go all the way when you want the full
                  map. Every reading is written for your birth details — no
                  templates reshuffled, no cold reading.
                </p>
                <Link href={READINGS_PATH} className="ink-button large-button mt-7">
                  Compare the readings <span aria-hidden="true">→</span>
                </Link>
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                {READING_OFFERS.map((offer) => (
                  <article
                    key={offer.slug}
                    className="flex flex-col border border-[#14110d]/15 bg-[#f4f0e7]/78 p-5"
                  >
                    <p className="font-serif text-3xl text-[#9e3d24]">{offer.priceLabel}</p>
                    <h3 className="mt-3 font-serif text-2xl leading-none text-[#14110d]">{offer.name}</h3>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-[#5b5148]">{offer.oneLine}</p>
                    <p className="mt-3 text-xs font-bold uppercase leading-relaxed text-[#14110d]/60">
                      {offer.bestFor}
                    </p>
                    <Link href={readingOfferHref(offer)} className="paper-button mt-5 py-3 text-center">
                      {offer.cta}
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-10 px-5 py-16 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <p className="oracle-eyebrow">from checkout to answer</p>
            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              {buySteps.map((step) => (
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

        <section className="relative z-10 border-y border-[#14110d]/15 bg-[#14110d] px-5 py-16 text-[#f4f0e7] sm:px-8 lg:px-10">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="oracle-eyebrow text-[#c8bca8]">what a reading looks at</p>
              <h2 className="mt-4 max-w-xl font-serif text-4xl leading-[0.98] sm:text-5xl">
                The cards get interesting when you know whose card you are reading.
              </h2>
            </div>
            <div className="space-y-5 text-base leading-relaxed text-[#d7cdbc] sm:text-lg">
              <p>
                A birth card is not just a label for yourself. It becomes sharp
                when it is compared with a partner, parent, friend, client,
                collaborator, or the person who keeps getting under your skin —
                the way they love, compete, avoid, lead, spend, disappear,
                return, or try to control the room.
              </p>
              <p>
                A good reading gives language to the thing everyone feels but
                nobody has named yet: why a person feels familiar before you
                know them, where attraction turns into friction, how family
                roles repeat, why money or responsibility becomes the pressure
                point, and what the current timing card is asking you to handle
                cleanly.
              </p>
              <p className="font-serif text-2xl leading-snug text-[#f4f0e7]">
                The card is not the whole person. It is the recurring shape you
                finally have words for — and a reading points it at your life.
              </p>
              <Link href={READINGS_PATH} className="paper-button large-button mt-2">
                Get that in writing <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>

        <section className="relative z-10 px-5 py-16 sm:px-8 lg:px-10">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.82fr_1.18fr]">
            <div className="border border-[#14110d]/18 bg-[#f4f0e7]/78 p-6 sm:p-8">
              <p className="oracle-eyebrow">start free</p>
              <h2 className="mt-4 font-serif text-4xl leading-none sm:text-5xl">
                Not ready for a reading? Learn the system first.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-[#5b5148] sm:text-lg">
                Everything on this site is built from the same deterministic
                engine as the paid readings. Calculate your card, read the
                meaning, compare two people, study the timing language — free.
                When a real question shows up, the reading is here.
              </p>
              <Link href="/birth-card-calculator" className="ink-button large-button mt-7">
                Find your birth card <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div className="grid gap-px overflow-hidden border border-[#14110d]/15 bg-[#14110d]/15 sm:grid-cols-2">
              {freeTools.map((item) => (
                <Link key={item.label} href={item.href} className="block bg-[#f4f0e7] p-5 transition hover:bg-[#fffaf0] sm:p-6">
                  <h3 className="font-serif text-2xl">{item.label}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#5b5148]">{item.detail}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="relative z-10 border-y border-[#14110d]/15 bg-[#14110d] px-5 py-16 text-[#f4f0e7] sm:px-8 lg:px-10">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="oracle-eyebrow text-[#c8bca8]">who writes the readings</p>
              <h2 className="mt-4 max-w-lg font-serif text-4xl leading-[0.98] sm:text-5xl">
                The deck becomes a map when someone has lived inside it long enough.
              </h2>
            </div>
            <div className="space-y-5 text-base leading-relaxed text-[#d7cdbc] sm:text-lg">
              <p>
                Cass was told at five years old that he was the Eight of
                Diamonds in the Crown Line. He spent decades living inside the
                symbols, then years reverse-engineering the structure underneath
                them.
              </p>
              <p>
                That mastery matters because the system becomes recognizable in
                lived experience: family roles, attraction, creative pressure,
                money habits, leadership style, and recurring relationship
                patterns. Every reading is built from that structure and written
                for the actual birthday in front of it.
              </p>
              <p>
                The point is simple: calculate the card, apply it to actual
                people, name the pattern clearly, and see whether it explains
                something real.
              </p>
            </div>
          </div>
        </section>

        <section className="relative z-10 px-5 py-16 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-4xl border border-[#14110d]/18 bg-[#f4f0e7]/82 p-6 text-center shadow-[0_1.5rem_4rem_rgba(20,17,13,0.1)] sm:p-10">
            <p className="oracle-eyebrow">bring the question</p>
            <h2 className="mt-4 font-serif text-4xl leading-none sm:text-6xl">
              You already know the person. Get the pattern in writing.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#5b5148] sm:text-lg">
              A birth date and a real question are enough. The reading does the
              rest: the card, the shadow, the dynamic, and what it keeps asking
              you to handle.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href={READINGS_PATH} className="ink-button large-button">
                Choose your reading
              </Link>
              <Link href="/birth-card-calculator" className="paper-button large-button">
                Find your card first — free
              </Link>
            </div>
          </div>
        </section>

        <footer className="relative z-10 mx-auto w-full max-w-7xl px-5 py-12 sm:px-8 lg:px-10">
          <p className="oracle-eyebrow mb-5 text-[#14110d]/60">Cardology Pro</p>
          <div className="grid gap-8 text-sm text-[#3d352d] sm:grid-cols-3">
            <div>
              <p className="mb-2 font-serif text-base text-[#14110d]">Personal readings</p>
              <ul className="space-y-1.5">
                {READING_OFFERS.map((offer) => (
                  <li key={offer.slug}>
                    <Link href={readingOfferHref(offer)} className="hover:text-[#14110d]">
                      <span className="text-[#9e3d24]">{offer.priceLabel}</span> {offer.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href={READINGS_PATH} className="font-bold text-[#9e3d24] hover:text-[#14110d]">
                    Compare all readings →
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-2 font-serif text-base text-[#14110d]">Free tools</p>
              <ul className="space-y-1.5">
                <li><Link href="/birth-card-calculator" className="hover:text-[#14110d]">Birth Card Calculator</Link></li>
                <li><Link href="/birth-card-compatibility-calculator" className="hover:text-[#14110d]">Compatibility Calculator</Link></li>
                <li><Link href="/52-day-period-meaning-tool" className="hover:text-[#14110d]">52-Day Period Meaning Tool</Link></li>
                <li><Link href="/birth-card" className="hover:text-[#14110d]">All 52 Birth Card Meanings</Link></li>
              </ul>
            </div>
            <div>
              <p className="mb-2 font-serif text-base text-[#14110d]">Learn the system</p>
              <ul className="space-y-1.5">
                <li><Link href="/what-is-cardology" className="hover:text-[#14110d]">What Is Cardology?</Link></li>
                <li><Link href="/52-card-astrology-explained" className="hover:text-[#14110d]">52-Card Astrology, Explained</Link></li>
                <li><Link href="/birth-card-vs-ruling-card" className="hover:text-[#14110d]">Birth Card vs Ruling Card</Link></li>
                <li><Link href="/cardology-compatibility" className="hover:text-[#14110d]">Cardology Compatibility</Link></li>
                <li><Link href="/shadow-karma-guide" className="hover:text-[#14110d]">Shadow &amp; Karma Guide</Link></li>
                <li><Link href="/blog" className="hover:text-[#14110d]">Cardology Blog</Link></li>
                <li><Link href={VIDEO_PATH} className="hover:text-[#14110d]">Cardology Videos</Link></li>
              </ul>
            </div>
          </div>
          <p className="mt-8 text-xs leading-relaxed text-[#5b5148]">
            Calculated from the deterministic Cardology system. Same birthday,
            same card, every time. A pattern language for people, relationships,
            timing, and recurring dynamics.
          </p>
        </footer>
      </main>
    </>
  );
}
