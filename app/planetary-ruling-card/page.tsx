import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { BirthCardCalculator } from "@/components/seo/BirthCardCalculator";
import { ReadingBridge } from "@/components/seo/ReadingBridge";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const TITLE = "Planetary Ruling Card: What It Is & How to Find Yours";
const DESCRIPTION =
  "Your planetary ruling card is the second card tied to your birthday's zodiac context. What it means, how it differs from your birth card, and a free lookup.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/planetary-ruling-card" },
  openGraph: {
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    url: "/planetary-ruling-card",
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Card Blueprints" }],
  },
};

const faqs = [
  {
    q: "What is a planetary ruling card?",
    a: "In Cardology, the planetary ruling card is a second playing card attached to your birthday through its planetary or zodiac context. Your birth card is the fixed core pattern; the ruling card colors how that pattern expresses itself in the world.",
  },
  {
    q: "How do I find my planetary ruling card?",
    a: "Use the free birth card calculator at cardblueprints.com/birth-card-calculator. Enter your month, day, and year and it returns both your birth card and your planetary ruling card instantly.",
  },
  {
    q: "Is the ruling card the same as the birth card?",
    a: "No. The birth card is set by the calendar position of your birthday and never changes. The ruling card comes from the birthday's zodiac sign and acts as a second layer — the style or costume the birth card wears, not the card itself.",
  },
  {
    q: "Can you have two ruling cards?",
    a: "Yes. Some birthdays sit on cusps where two planetary influences apply, and those birthdays carry two ruling cards. Both add nuance to how the birth card shows up.",
  },
  {
    q: "What does the ruling card actually change in a reading?",
    a: "It changes expression, not identity. Two people with the same birth card but different ruling cards tend to run the same core pattern in visibly different styles — one louder, one quieter, one more strategic, one more direct.",
  },
];

export default function PlanetaryRulingCard() {
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: TITLE,
    description: DESCRIPTION,
    author: { "@type": "Person", name: "Cassidy Rice" },
    publisher: { "@type": "Organization", name: SITE_NAME },
    dateModified: "2026-08-15",
    mainEntityOfPage: `${SITE_URL}/planetary-ruling-card`,
  };

  return (
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "Planetary Ruling Card", href: "/planetary-ruling-card" }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(article) }} />

      <h1 className="display mb-3 text-3xl text-bone">Planetary Ruling Card</h1>
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5" data-ai-summary>
        <p className="eyebrow mb-2 text-gold">Direct answer</p>
        <p className="prose-reading text-mist">
          Your planetary ruling card is the second card attached to your birthday through
          its zodiac context. The birth card is the core pattern you run; the ruling card
          is how that pattern expresses. Enter a birthday below to see both, free.
        </p>
      </div>
      <p className="mb-2 text-xs text-faint">
        By Cassidy Rice · Updated August 15, 2026 ·{" "}
        <Link href="/editorial-policy" className="text-gold underline underline-offset-4">
          Editorial policy
        </Link>
      </p>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">What the ruling card is</h2>
        <p className="prose-reading text-mist">
          Cardology runs on two cards, not one. The <strong>birth card</strong> is fixed
          by the calendar position of your month and day — the same every year, for
          everyone born that day. The <strong>planetary ruling card</strong> is selected
          through the birthday&rsquo;s zodiac sign, the way an astrologer would look at a
          chart ruler. It does not replace the birth card; it describes the style the
          birth card wears in public.
        </p>
        <p className="prose-reading mt-3 text-mist">
          The full distinction — with examples — is on{" "}
          <Link href="/birth-card-vs-ruling-card" className="text-gold underline underline-offset-4">
            birth card vs ruling card
          </Link>
          , and the underlying math is documented on the{" "}
          <Link href="/methodology" className="text-gold underline underline-offset-4">
            methodology page
          </Link>
          .
        </p>
      </section>

      <section className="mt-10">
        <h2 className="eyebrow mb-2 text-gold">Find your planetary ruling card</h2>
        <p className="prose-reading mb-4 text-mist">
          Enter any birthday. The calculator returns the birth card and the planetary
          ruling card together — no signup, no email.
        </p>
        <BirthCardCalculator />
      </section>

      <section className="mt-10">
        <h2 className="eyebrow mb-2 text-gold">Why it matters</h2>
        <p className="prose-reading text-mist">
          Two people can share a birth card and still look nothing alike. The ruling card
          is usually why. Read the birth card for the operating pattern and the ruling
          card for the presentation: how someone argues, flirts, works, and recovers.
          Some birthdays carry two ruling cards on a cusp; both color the expression.
        </p>
      </section>

      <section className="mt-10" id="faq">
        <h2 className="eyebrow mb-4 text-gold">Planetary ruling card FAQ</h2>
        <div className="space-y-4">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h3 className="font-serif text-lg text-bone">{f.q}</h3>
              <p className="prose-reading mt-2 text-sm text-mist">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <ReadingBridge variant="general" className="mt-8" />

      <div className="card-surface mt-6 rounded-2xl p-5">
        <p className="font-serif text-base text-bone">Keep going</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/what-is-cardology" className="inline-block rounded-full bg-foil px-5 py-2 font-serif text-sm text-ink">
            What is Cardology? →
          </Link>
          <Link href="/birth-card" className="inline-block rounded-full border border-gold/30 px-5 py-2 font-serif text-sm text-gold">
            All 52 card meanings →
          </Link>
          <Link href="/card-of-the-day" className="inline-block rounded-full border border-gold/30 px-5 py-2 font-serif text-sm text-gold">
            Card of the day →
          </Link>
        </div>
      </div>
    </SeoShell>
  );
}
