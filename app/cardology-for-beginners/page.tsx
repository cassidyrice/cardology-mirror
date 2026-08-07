import type { Metadata } from "next";
import Link from "next/link";
import { FreeCourseCta } from "@/components/free-course/FreeCourseCta";
import { SeoShell } from "@/components/seo/SeoShell";
import { BirthCardCalculator } from "@/components/seo/BirthCardCalculator";
import { ReadingBridge } from "@/components/seo/ReadingBridge";
import {
  BIRTHDAY_DIRECTORY_PATH,
  COMPATIBILITY_DIRECTORY_PATH,
  SITE_NAME,
} from "@/lib/site";

const TITLE = "Cardology for Beginners: Find Your Birth Card in 10 Minutes";
const DESCRIPTION =
  "Cardology for beginners: what the 52-card system is, how to find your birth card with playing cards, birth vs ruling card, compatibility, and when a written Blueprint helps.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/cardology-for-beginners" },
  openGraph: {
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    url: "/cardology-for-beginners",
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Card Blueprints" }],
  },
};

const steps = [
  {
    n: "1",
    title: "Learn what Cardology is",
    body: "It is a fixed map from birthday to one playing card — not a shuffled tarot draw and not astrology planets. Same birthday always returns the same card.",
    href: "/what-is-cardology",
    label: "What is Cardology?",
  },
  {
    n: "2",
    title: "Find your birth card",
    body: "Use the free calculator with month, day, and year. You get the lifelong birth card plus the planetary ruling card layer.",
    href: "/birth-card-calculator",
    label: "Open calculator page",
  },
  {
    n: "3",
    title: "Separate birth card from ruling card",
    body: "Birth card is the engine. Ruling card is the steering. If one description fits and the other explains the tone, you are reading it correctly.",
    href: "/birth-card-vs-ruling-card",
    label: "Birth vs ruling",
  },
  {
    n: "4",
    title: "Read one real day",
    body: "Pull today’s card of the day or notice which suit domain is loud in your week — hearts, clubs, diamonds, or spades.",
    href: "/card-of-the-day",
    label: "Card of the day",
  },
  {
    n: "5",
    title: "Compare two people",
    body: "Run two birthdays through the compatibility calculator, then open the pair page for the deeper dynamic.",
    href: "/birth-card-compatibility-calculator",
    label: "Compatibility calculator",
  },
  {
    n: "6",
    title: "Deepen only if it earns it",
    body: "If the free tools keep matching real life, the Personal Card Blueprint ($29) writes the full pattern as an instant report — no phone call.",
    href: "/products/personal-card-blueprint",
    label: "Personal Card Blueprint",
  },
];

const faqs = [
  {
    q: "What do I need to start Cardology as a beginner?",
    a: "A birthday and about ten minutes. You do not need a special deck to calculate a birth card — the free calculator does the math. A standard 52-card deck helps later if you want to practice spreads.",
  },
  {
    q: "Is Cardology hard to learn?",
    a: "The entry point is simple: one birthday → one card. Depth comes from suits, ranks, ruling cards, timing, and relationships. Start with your card, then add one layer at a time.",
  },
  {
    q: "Should beginners start with tarot or Cardology?",
    a: "If you want a fixed birthday significator from playing cards, start with Cardology. If you want shuffled Major Arcana narratives, start with tarot. They are different tools; this site teaches the playing-card system.",
  },
  {
    q: "What should I do after I know my birth card?",
    a: "Read the full card meaning, check your ruling card, look up one important person in your life, and test the language against a real week. Then decide whether a written Blueprint is worth it.",
  },
];

export default function CardologyForBeginnersPage() {
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const howTo = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to start Cardology as a beginner",
    description: DESCRIPTION,
    step: steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.title,
      text: s.body,
      url: `https://cardblueprints.com${s.href}`,
    })),
  };

  return (
    <SeoShell
      crumb={[
        { label: "Home", href: "/" },
        { label: "What is Cardology?", href: "/what-is-cardology" },
        { label: "For Beginners", href: "/cardology-for-beginners" },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howTo) }} />

      <h1 className="display mb-3 text-3xl text-bone">Cardology for Beginners</h1>
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5" data-ai-summary>
        <p className="eyebrow mb-2 text-gold">Direct answer</p>
        <p className="prose-reading text-mist">
          Start Cardology by finding the playing card locked to your birthday, reading
          suit and rank in plain language, then testing the pattern against real life.
          Use free tools first; buy a written Blueprint only if the system keeps earning
          your attention.
        </p>
      </div>
      <p className="mb-6 text-xs text-faint">
        By Cassidy Rice · Updated August 7, 2026 ·{" "}
        <Link href="/editorial-policy" className="text-gold underline underline-offset-4">
          Editorial policy
        </Link>
      </p>
      <p className="prose-reading mb-8 text-mist">
        This path is for people who searched <strong>cardology for beginners</strong>,{" "}
        <strong>how to find my birth card</strong>, or{" "}
        <strong>what card am I based on my birthday</strong> and want the playing-card
        system — not tarot Major Arcana math and not baby-announcement “birth cards.”
        For the long definition, see{" "}
        <Link href="/what-is-cardology" className="text-gold underline underline-offset-4">
          what Cardology is
        </Link>
        .
      </p>

      <section className="mt-4">
        <h2 className="eyebrow mb-4 text-gold">The 10-minute path</h2>
        <ol className="space-y-4">
          {steps.map((s) => (
            <li key={s.n} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-gold">
                Step {s.n}
              </p>
              <h3 className="mt-1 font-serif text-xl text-bone">{s.title}</h3>
              <p className="prose-reading mt-2 text-sm text-mist">{s.body}</p>
              <Link href={s.href} className="mt-3 inline-block text-sm text-gold underline underline-offset-4">
                {s.label} →
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="eyebrow mb-2 text-gold">Step 2 live: find your birth card</h2>
        <p className="prose-reading mb-4 text-mist">
          Enter any birthday. The result is deterministic — refresh will not change it.
        </p>
        <BirthCardCalculator />
      </section>

      <section className="mt-10">
        <h2 className="eyebrow mb-2 text-gold">The only vocabulary you need on day one</h2>
        <ul className="prose-reading space-y-2 text-mist">
          <li>
            <strong>Birth card</strong> — the lifelong playing card for your birthday.
          </li>
          <li>
            <strong>Suit</strong> — hearts (feeling), clubs (mind), diamonds (value),
            spades (work/will).
          </li>
          <li>
            <strong>Rank</strong> — Ace through King as movement inside that suit.
          </li>
          <li>
            <strong>Ruling card</strong> — expression style layered on the birth card.
          </li>
        </ul>
        <p className="prose-reading mt-3 text-mist">
          When you want spreads instead of birthday math, switch to{" "}
          <Link href="/how-to-read-playing-cards" className="text-gold underline underline-offset-4">
            how to read playing cards
          </Link>
          .
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">How to know it is working</h2>
        <p className="prose-reading text-mist">
          A useful card description names a specific behavior you can point to in the
          last month — not vague flattery. If nothing matches after an honest week,
          set it down. Cardology is a lens for self-awareness and entertainment;
          tendencies, not fate. Method transparency lives on{" "}
          <Link href="/methodology" className="text-gold underline underline-offset-4">
            methodology
          </Link>
          .
        </p>
      </section>

      <div className="card-surface mt-8 rounded-2xl border border-gold/25 p-5">
        <p className="font-serif text-base text-bone">When free tools are not enough</p>
        <p className="mt-2 text-sm leading-relaxed text-mist">
          The Personal Card Blueprint is a one-time $29 written report: birth card,
          ruling layer, and current chapter in one place — instant after checkout.
        </p>
        <Link
          href="/products/personal-card-blueprint"
          className="mt-4 inline-block rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-ink hover:opacity-90"
        >
          Get Your Personal Blueprint &mdash; $29
        </Link>
      </div>

      <section className="mt-10">
        <h2 className="eyebrow mb-4 text-gold">Beginner FAQ</h2>
        <div className="space-y-4">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h3 className="font-serif text-lg text-bone">{f.q}</h3>
              <p className="prose-reading mt-2 text-sm text-mist">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <FreeCourseCta source="beginners" className="mt-10" />
      <ReadingBridge variant="general" className="mt-8" />

      <div className="card-surface mt-6 rounded-2xl p-5">
        <p className="font-serif text-base text-bone">Browse the library</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href={BIRTHDAY_DIRECTORY_PATH} className="rounded-full border border-white/15 px-4 py-2 text-sm text-mist hover:text-bone">
            Every birthday
          </a>
          <a href={COMPATIBILITY_DIRECTORY_PATH} className="rounded-full border border-white/15 px-4 py-2 text-sm text-mist hover:text-bone">
            Every pairing
          </a>
          <Link href="/birth-card" className="rounded-full border border-white/15 px-4 py-2 text-sm text-mist hover:text-bone">
            All 52 cards
          </Link>
          <Link href="/about" className="rounded-full border border-white/15 px-4 py-2 text-sm text-mist hover:text-bone">
            About Card Blueprints
          </Link>
        </div>
      </div>
    </SeoShell>
  );
}
