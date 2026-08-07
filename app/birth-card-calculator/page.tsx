import type { Metadata } from "next";
import Link from "next/link";
import { FreeCourseCta } from "@/components/free-course/FreeCourseCta";
import { SeoShell } from "@/components/seo/SeoShell";
import { BirthCardCalculator } from "@/components/seo/BirthCardCalculator";
import {
  BIRTHDAY_DIRECTORY_PATH,
  COMPATIBILITY_DIRECTORY_PATH,
  SITE_NAME,
} from "@/lib/site";

const TITLE = "Birth Card Calculator (Playing Cards / Cardology)";
const DESCRIPTION =
  "Free birth card calculator for the 52 playing-card Cardology system — not tarot, not a baby announcement card. Enter a birthday to find the fixed birth card and ruling card.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/birth-card-calculator" },
  openGraph: {
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    url: "/birth-card-calculator",
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Card Blueprints" }],
  },
};

const faqs = [
  {
    q: "What is a birth card in Cardology?",
    a: "In Cardology, your birth card is the single playing card your birthday maps to in a fixed 52-card system. It is calculated from month and day, stays the same for life, and describes a default pattern — not a random tarot draw and not a paper birth announcement.",
  },
  {
    q: "Is this a tarot birth card calculator?",
    a: "No. Tarot birth cards use Major Arcana math from a different tradition. This calculator uses a standard 52-card playing deck (Hearts, Clubs, Diamonds, Spades) in the Cardology / playing-card astrology system. If you want tarot pairs like Death and the Emperor, use a tarot tool; if you want your birthday’s playing card, use this one.",
  },
  {
    q: "How is the birth card calculated?",
    a: "It is a deterministic formula on birth month and day. The same birthday always produces the same card — no shuffle, no interpretation step, and nothing random. You can re-run it anytime and get the same result.",
  },
  {
    q: "Does the birth year matter?",
    a: "Your birth card depends only on month and day. The year is used for timing layers and yearly spreads, not for the birth card itself.",
  },
  {
    q: "What is the difference between a birth card and a ruling card?",
    a: "The birth card is the core pattern. The planetary ruling card is the style it expresses through, selected by your zodiac sign’s ruling planet acting on your birth card’s position. Two people with the same birth card but different signs usually have different ruling cards.",
  },
  {
    q: "Which playing card represents my birthday?",
    a: "Enter the full birthday below. The calculator returns the playing card for that date plus the ruling card layer. You can also browse every date in the birthday directory.",
  },
  {
    q: "Can two people have the same birth card?",
    a: "Yes. 364 of 365 calendar dates map to the 52 cards, so most cards cover several birthdays. December 31 maps to the Joker; February 29 sits outside the cycle. The ruling-card layer often differs even when the birth card matches.",
  },
];

export default function CalculatorPage() {
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const appLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Cardology Birth Card Calculator",
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    description: DESCRIPTION,
    url: "https://cardblueprints.com/birth-card-calculator",
  };

  return (
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "Birth Card Calculator", href: "/birth-card-calculator" }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appLd) }} />

      <h1 className="display mb-3 text-3xl text-bone">
        Birth Card Calculator for Playing Cards
      </h1>
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5" data-ai-summary>
        <p className="eyebrow mb-2 text-gold">Direct answer</p>
        <p className="prose-reading text-mist">
          Enter a birthday to find the fixed <strong>Cardology birth card</strong> —
          one card from a standard 52-card deck. Same birthday always returns the
          same card. This is playing-card Cardology, not tarot birth cards and not
          a baby birth announcement template.
        </p>
      </div>
      <p className="prose-reading mb-6 text-mist">
        Use this free tool when you want{" "}
        <strong>what card am I based on my birthday</strong> in the Cardology
        system. Results include your lifelong birth card and planetary ruling card,
        with links to full meanings. Method details live on the{" "}
        <Link href="/methodology" className="text-gold underline underline-offset-4">
          methodology page
        </Link>
        .
      </p>

      <BirthCardCalculator />

      <div className="card-surface mt-8 rounded-2xl border border-gold/25 p-5">
        <p className="font-serif text-base text-bone">
          Want the full pattern, not just the card?
        </p>
        <p className="mt-2 text-sm leading-relaxed text-mist">
          The Personal Card Blueprint writes out your birth card, ruling card,
          and the chapter you&rsquo;re in now — delivered instantly after
          checkout, no phone call.
        </p>
        <div className="mt-4">
          <Link
            href="/products/personal-card-blueprint"
            className="inline-block rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-ink hover:opacity-90"
          >
            Get Your Personal Blueprint &mdash; $29
          </Link>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="eyebrow mb-2 text-gold">Not tarot. Not stationery.</h2>
        <p className="prose-reading text-mist">
          Search results for &ldquo;birth card calculator&rdquo; often mix three
          different things: tarot Major Arcana birth cards, paper birth-announcement
          designs, and the 52-card playing-card system used here. This page is only
          the third. If you need{" "}
          <strong>birth card calculator astrology</strong> or{" "}
          <strong>birth card calculator playing cards</strong>, you are in the
          right place. New to the system? Start with{" "}
          <Link href="/cardology-for-beginners" className="text-gold underline underline-offset-4">
            Cardology for beginners
          </Link>{" "}
          or{" "}
          <Link href="/what-is-cardology" className="text-gold underline underline-offset-4">
            what Cardology is
          </Link>
          .
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">What you&rsquo;ll get</h2>
        <ul className="prose-reading space-y-1.5 text-mist">
          <li>Your <strong>birth card</strong> — your lifelong significator in the deck.</li>
          <li>Your <strong>planetary ruling card</strong> — how that pattern tends to express.</li>
          <li>Links into the birthday directory and full card meanings.</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">How it works</h2>
        <p className="prose-reading text-mist">
          Cardology maps 364 of the 365 calendar dates to the 52 playing cards
          through a fixed formula — December 31 gets the Joker, and February 29
          sits outside the cycle. There is no chart to draw and nothing random.
          That is why we call it a mirror, not a forecast.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">Reading your result</h2>
        <p className="prose-reading text-mist">
          The birth card is the engine: the core pattern that stays fixed for life.
          The planetary ruling card is the steering: the style that pattern
          expresses through. If the birth-card description feels almost right but
          the tone is off, the ruling card is usually the missing piece. Treat both
          as structured hypotheses — test them against a real week of your life.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="eyebrow mb-4 text-gold">Birth card calculator FAQ</h2>
        <div className="space-y-4">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h3 className="font-serif text-lg text-bone">{f.q}</h3>
              <p className="prose-reading mt-2 text-sm text-mist">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <FreeCourseCta source="birth-card-calculator" className="mt-10" />

      <div className="card-surface mt-8 rounded-2xl p-5">
        <p className="font-serif text-base text-bone">Already know your card?</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/birth-card" className="rounded-full border border-white/15 px-4 py-2 text-sm text-mist hover:text-bone">
            Browse all 52 cards
          </Link>
          <a href={BIRTHDAY_DIRECTORY_PATH} className="rounded-full border border-white/15 px-4 py-2 text-sm text-mist hover:text-bone">
            Birthdays by date
          </a>
          <a href={COMPATIBILITY_DIRECTORY_PATH} className="rounded-full border border-white/15 px-4 py-2 text-sm text-mist hover:text-bone">
            All card pairings
          </a>
          <Link href="/cardology-compatibility" className="rounded-full border border-white/15 px-4 py-2 text-sm text-mist hover:text-bone">
            Compatibility guide
          </Link>
          <Link href="/methodology" className="rounded-full border border-white/15 px-4 py-2 text-sm text-mist hover:text-bone">
            Methodology
          </Link>
        </div>
      </div>
    </SeoShell>
  );
}
