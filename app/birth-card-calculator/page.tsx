import type { Metadata } from "next";
import Link from "next/link";
import { SeoShell } from "@/components/seo/SeoShell";
import { BirthCardCalculator } from "@/components/seo/BirthCardCalculator";

export const metadata: Metadata = {
  title: "Birth Card Calculator: Find Your Cardology Birth Card",
  description:
    "Free birth card calculator. Enter your birthday to instantly find your Cardology birth card and planetary ruling card — then read what your card means.",
  alternates: { canonical: "/birth-card-calculator" },
  openGraph: {
    title: "Birth Card Calculator: Find Your Cardology Birth Card",
    description:
      "Enter your birthday to instantly find your Cardology birth card and ruling card.",
    url: "/birth-card-calculator",
  },
};

export default function CalculatorPage() {
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is a birth card?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Your birth card is the single playing card that your birthday maps to in the Cardology system. It's fixed for life and describes how you tend to operate.",
        },
      },
      {
        "@type": "Question",
        name: "How is the birth card calculated?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "It's a deterministic formula based on your birth month and day. The same birthday always produces the same card — no interpretation or randomness involved.",
        },
      },
      {
        "@type": "Question",
        name: "Does the birth year matter?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Your birth card depends only on the month and day. The year is used for timing and yearly spreads, not for the birth card itself.",
        },
      },
    ],
  };

  return (
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "Birth Card Calculator", href: "/birth-card-calculator" }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />

      <h1 className="display mb-3 text-3xl text-bone">Birth Card Calculator</h1>
      <p className="prose-reading mb-6 text-mist">
        Enter your birthday to find your <strong>Cardology birth card</strong> —
        the one playing card your birth date maps to. It&rsquo;s deterministic:
        the same birthday always gives the same card.
      </p>

      <BirthCardCalculator />

      <section className="mt-10">
        <h2 className="eyebrow mb-2 text-gold">What you&rsquo;ll get</h2>
        <ul className="prose-reading space-y-1.5 text-mist">
          <li>Your <strong>birth card</strong> — your lifelong significator.</li>
          <li>Your <strong>planetary ruling card</strong> — a second layer that colors how the birth card expresses.</li>
          <li>A link to the full meaning: strengths, shadow, and the pattern in three positions.</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">How it works</h2>
        <p className="prose-reading text-mist">
          Cardology assigns every one of the 365 calendar dates to one of the 52
          playing cards through a fixed formula. There&rsquo;s no astrology chart to
          draw and nothing random — your card is a function of your birthday.
          That&rsquo;s why we call it a mirror, not a forecast:{" "}
          <Link href="/what-is-cardology" className="text-gold underline underline-offset-4">
            learn what Cardology is
          </Link>
          .
        </p>
      </section>

      <div className="card-surface mt-8 rounded-2xl p-5">
        <p className="font-serif text-base text-bone">Already know your card?</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/birth-card" className="rounded-full border border-white/15 px-4 py-2 text-sm text-mist hover:text-bone">
            Browse all 52 cards
          </Link>
          <Link href="/cardology-compatibility" className="rounded-full border border-white/15 px-4 py-2 text-sm text-mist hover:text-bone">
            Check compatibility
          </Link>
        </div>
      </div>
    </SeoShell>
  );
}
