import type { Metadata } from "next";
import Link from "next/link";
import { FreeCourseCta } from "@/components/free-course/FreeCourseCta";
import { SeoShell } from "@/components/seo/SeoShell";
import { CompatibilityCalculator } from "@/components/seo/CompatibilityCalculator";
import { ReadingBridge } from "@/components/seo/ReadingBridge";
import {
  BIRTHDAY_DIRECTORY_PATH,
  COMPATIBILITY_DIRECTORY_PATH,
  SITE_NAME,
  SITE_URL,
  VIDEO_PATH,
} from "@/lib/site";

const TITLE = "Cardology Compatibility Calculator (Playing Cards, Not Tarot)";
const DESCRIPTION =
  "Free playing-card compatibility calculator. Enter two birthdays — Cardology birth cards + Life Path map, not a tarot love reading. Same dates, same result.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/birth-card-compatibility-calculator" },
  openGraph: {
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    url: "/birth-card-compatibility-calculator",
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Card Blueprints" }],
  },
};

const faqs = [
  {
    q: "How does the Cardology compatibility calculator work?",
    a: "Enter two birthdays. The tool calculates each person’s fixed playing-card birth card, maps Life Path constitution positions, shows where each birth card lands in the other’s spectrum, and lists shared Life Path cards.",
  },
  {
    q: "Is this a destiny cards or tarot compatibility test?",
    a: "No. Tarot love/compatibility tools use Major Arcana or shuffled spreads. This calculator uses two birthdays in the Cardology 52-card playing-card system — fixed birth cards plus Life Path roles. Related Destiny Cards / Love Cards names point at the same deck family; we publish the method so you can check the math. Synonym map: https://cardblueprints.com/destiny-cards — longer split: https://cardblueprints.com/cardology-vs-tarot",
  },
  {
    q: "Does same suit mean better compatibility?",
    a: "No. Same suit can feel familiar, but it can also amplify the same blind spots. Read role landings (Venus, Mars, Saturn, Pluto, etc.) before treating suit match as a score.",
  },
  {
    q: "What is a Life Path constitution?",
    a: "Moon support plus 13 Life Path cards from the birth card in the Life Spread — mental, love, action, growth, lesson, shadow, reward, responsibility, embodiment, and command lines.",
  },
  {
    q: "Can Cardology decide whether a relationship should continue?",
    a: "It can name patterns: where two people bond, where they trigger each other, and what each tends to need. The decision still belongs to the people living it. Reflection and entertainment — not fate.",
  },
  {
    q: "Should I compare ruling cards too?",
    a: "Yes when you can. Birth cards show core pattern; ruling cards color day-to-day expression and attraction. Start with birthdays here, then open each card’s full page.",
  },
  {
    q: "Where can I browse every pair without entering dates?",
    a: "Use the compatibility directory of card hubs and pair pages, or the Cardology compatibility guide for method context.",
  },
];

export default function CompatibilityCalculatorPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Cardology Compatibility Calculator",
      applicationCategory: "LifestyleApplication",
      operatingSystem: "Any",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      description: DESCRIPTION,
      url: `${SITE_URL}/birth-card-compatibility-calculator`,
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: { "@type": "Answer", text: faq.a },
      })),
    },
  ];

  return (
    <SeoShell
      crumb={[
        { label: "Home", href: "/" },
        { label: "Compatibility", href: "/cardology-compatibility" },
        { label: "Calculator", href: "/birth-card-compatibility-calculator" },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1 className="display mb-3 text-3xl text-bone">
        Playing Card Compatibility Calculator
      </h1>
      <p className="mb-4 text-sm text-mist">
        Cardology two-birthday tool — 52 playing cards, not tarot.
      </p>
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5" data-ai-summary>
        <p className="eyebrow mb-2 text-gold">Quick answer</p>
        <p className="prose-reading text-mist">
          Enter two birthdays to compare <strong>playing-card birth cards</strong>, each
          Life Path constitution, where the other person lands in your spectrum, and
          which Life Path cards you share. Free, deterministic, not a tarot shuffle.
        </p>
      </div>
      <p className="prose-reading mb-6 text-mist">
        Built for queries like <strong>cardology compatibility calculator</strong>,{" "}
        <strong>birth card compatibility</strong>, and two-birthday relationship maps.
        After the result, open the matching pair page in the directory for the full
        write-up, or deepen with a{" "}
        <Link href="/products/personal-card-blueprint" className="text-gold underline underline-offset-4">
          Personal Card Blueprint ($29)
        </Link>{" "}
        for one person&rsquo;s full pattern in writing.
      </p>

      <aside className="mb-6 rounded-2xl border border-gold/25 bg-white/[0.03] p-4 sm:p-5" aria-label="Playing cards, not tarot">
        <p className="font-serif text-base text-bone">
          <strong>Playing cards, not tarot.</strong>
        </p>
        <p className="mt-2 text-sm leading-relaxed text-mist">
          Compare two birthdays in a standard 52-card deck — Hearts, Clubs, Diamonds,
          Spades. This is <strong>not</strong> a tarot love spread or Major Arcana pair
          tool. Same two dates always return the same birth cards and Life Path map.
        </p>
        <p className="mt-3 text-sm">
          <Link href="/cardology-vs-tarot" className="text-gold underline underline-offset-4">
            How Cardology differs from tarot →
          </Link>
          {" · "}
          <Link href="/destiny-cards" className="text-gold underline underline-offset-4">
            Destiny Cards &amp; Love Cards explained →
          </Link>
        </p>
      </aside>

      <CompatibilityCalculator />

      <div className="card-surface mt-8 rounded-2xl border border-gold/25 p-5">
        <p className="font-serif text-base text-bone">After you compare</p>
        <p className="mt-2 text-sm leading-relaxed text-mist">
          Browse the full matrix of hubs and pairs, or run one birthday through the
          birth card calculator if you only know one person so far.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={COMPATIBILITY_DIRECTORY_PATH}
            className="inline-block rounded-full border border-gold/30 px-4 py-2 text-sm text-gold"
          >
            All pairings →
          </a>
          <Link
            href="/birth-card-calculator"
            className="inline-block rounded-full border border-white/15 px-4 py-2 text-sm text-mist"
          >
            Birth card calculator →
          </Link>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="eyebrow mb-2 text-gold">How to read the result</h2>
        <p className="prose-reading text-mist">
          Start with birth-card chemistry, then Life Path cross-reference. If the other
          person&rsquo;s birth card lands in your Venus, Mars, Saturn, Neptune, or Pluto
          position, the relationship will feel different than if it lands nowhere in
          the first spectrum. Shared Life Path cards show where both people carry the
          same card in different roles. Method overview:{" "}
          <Link href="/cardology-compatibility" className="text-gold underline underline-offset-4">
            how Cardology compatibility works
          </Link>
          .
        </p>
      </section>

      <section className="mt-10">
        <h2 className="eyebrow mb-2 text-gold">Frequently asked questions</h2>
        <div className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.q} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h3 className="font-serif text-base text-bone">{faq.q}</h3>
              <p className="prose-reading mt-2 text-sm text-mist">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="eyebrow mb-3 text-gold">Related pages</h2>
        <ul className="grid gap-2 text-sm sm:grid-cols-2">
          {[
            ["Cardology Compatibility", "/cardology-compatibility"],
            ["Birth Card Calculator", "/birth-card-calculator"],
            ["Destiny Cards & Love Cards", "/destiny-cards"],
            ["Cardology vs Tarot", "/cardology-vs-tarot"],
            ["All 52 Birth Cards", "/birth-card"],
            ["Cardology for Beginners", "/cardology-for-beginners"],
            ["Cardology Videos", VIDEO_PATH],
          ].map(([label, href]) => (
            <li key={href}>
              <Link href={href} className="text-gold underline underline-offset-4">
                {label}
              </Link>
            </li>
          ))}
          <li>
            <a href={COMPATIBILITY_DIRECTORY_PATH} className="text-gold underline underline-offset-4">
              Browse every card pairing
            </a>
          </li>
          <li>
            <a href={BIRTHDAY_DIRECTORY_PATH} className="text-gold underline underline-offset-4">
              Birthdays by date
            </a>
          </li>
        </ul>
      </section>

      <FreeCourseCta source="compatibility-calculator" className="mt-10" />
      <ReadingBridge variant="relationship" className="mt-8" />
    </SeoShell>
  );
}
