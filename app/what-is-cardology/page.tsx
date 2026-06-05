import type { Metadata } from "next";
import Link from "next/link";
import { SeoShell } from "@/components/seo/SeoShell";

export const metadata: Metadata = {
  title: "What Is Cardology? The 52-Card System, Explained",
  description:
    "What is Cardology? A plain-English explanation of the deterministic 52-card system that maps your birthday to a single playing card — your birth card.",
  alternates: { canonical: "/what-is-cardology" },
  openGraph: {
    title: "What Is Cardology? The 52-Card System, Explained",
    description: "A plain-English explanation of the deterministic 52-card system behind your birth card.",
    url: "/what-is-cardology",
  },
};

export default function WhatIsCardology() {
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Is Cardology the same as astrology?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "They're related but different. Astrology reads the positions of planets at your birth; Cardology maps your birthday to one of the 52 playing cards through a fixed mathematical system. Cardology is fully deterministic — no chart drawing and nothing random.",
        },
      },
      {
        "@type": "Question",
        name: "Does Cardology predict the future?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. We treat it as a mirror, not a forecast — a vocabulary for noticing how you tend to operate, not a prediction of events.",
        },
      },
      {
        "@type": "Question",
        name: "How many birth cards are there?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "There are 52 birth cards — one for each card in a standard deck. Every birthday maps to exactly one of them.",
        },
      },
    ],
  };

  return (
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "What is Cardology?", href: "/what-is-cardology" }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />

      <h1 className="display mb-3 text-3xl text-bone">What Is Cardology?</h1>
      <p className="prose-reading mb-6 text-mist">
        Cardology is a system that maps your birthday to a single playing card —
        your <strong>birth card</strong> — and uses the 52-card deck as a
        language for personality, timing, and relationships. Unlike a horoscope,
        it&rsquo;s <strong>deterministic</strong>: the same birthday always produces the
        same card, through a fixed formula rather than interpretation.
      </p>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">The core idea</h2>
        <p className="prose-reading text-mist">
          A standard deck has 52 cards, and the calendar has 52 weeks. Cardology
          links the two: every one of the 365 dates is assigned to a card by a
          set rule. Your birth card is your lifelong significator — the clearest
          single description of how you tend to operate.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">Why "a mirror, not a forecast"</h2>
        <p className="prose-reading text-mist">
          We don&rsquo;t use the cards to predict events. We use them to reflect
          patterns back to you — your strengths, the ways those strengths slip
          under stress, and where they tip into excess. Nothing here is fixed
          fate; it&rsquo;s a starting vocabulary for self-awareness.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">The four suits</h2>
        <p className="prose-reading mb-2 text-mist">Each suit points at a different domain of life:</p>
        <ul className="prose-reading space-y-1.5 text-mist">
          <li><span className="text-[#e0654a]">♥ Hearts</span> — relationships &amp; emotion</li>
          <li><span className="text-[#d9b26a]">♦ Diamonds</span> — values &amp; resources</li>
          <li><span className="text-[#7fae8f]">♣ Clubs</span> — mind &amp; communication</li>
          <li><span className="text-[#7b6cf0]">♠ Spades</span> — work, will &amp; transformation</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">Two layers: birth card and ruling card</h2>
        <p className="prose-reading text-mist">
          Most people have two key cards — the birth card and a planetary ruling
          card that colors how it expresses. We break down the difference in{" "}
          <Link href="/birth-card-vs-ruling-card" className="text-gold underline underline-offset-4">
            birth card vs ruling card
          </Link>
          .
        </p>
      </section>

      <div className="card-surface mt-10 rounded-2xl p-5">
        <p className="font-serif text-base text-bone">Find your birth card</p>
        <p className="mt-1 text-sm text-faint">It takes one tap and your birthday.</p>
        <Link href="/birth-card-calculator" className="mt-3 inline-block rounded-full bg-foil px-5 py-2 font-serif text-sm text-ink">
          Birth Card Calculator →
        </Link>
      </div>

      <p className="mt-6 text-sm">
        <Link href="/52-card-astrology-explained" className="text-gold underline underline-offset-4">
          Next: 52-card astrology explained →
        </Link>
      </p>
    </SeoShell>
  );
}
