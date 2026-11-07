import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";

import "@/app/compat.css";
import { CompatibilityCalculator } from "@/components/seo/CompatibilityCalculator";
import { StanReadingCta } from "@/components/seo/StanReadingCta";
import {
  BIRTHDAY_DIRECTORY_PATH,
  COMPATIBILITY_DIRECTORY_PATH,
  SITE_NAME,
  SITE_URL,
  VIDEO_PATH,
} from "@/lib/site";

const TITLE = "Birth Card Compatibility Calculator (Destiny Cards, Free)";
const DESCRIPTION =
  "Free birth card compatibility calculator. Enter two birthdays for both Destiny Cards birth cards and the Life Path map. Playing cards, not a tarot love reading.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/birth-card-compatibility-calculator" },
  openGraph: {
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    url: "/birth-card-compatibility-calculator",
    images: [{ url: "/og/cardology-compatibility.png", width: 1200, height: 630, alt: "Are your cards compatible? Two playing cards side by side" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og/cardology-compatibility.png"],
  },
};

const faqs = [
  {
    q: "How does the Cardology compatibility calculator work?",
    a: "Enter two birthdays. The tool calculates each person’s fixed playing-card birth card. It maps Life Path constitution positions, shows where each birth card lands in the other’s spectrum, and lists shared Life Path cards. You will know exactly where it gets awkward.",
  },
  {
    q: "Is this a destiny cards or tarot compatibility test?",
    a: "No. Tarot love/compatibility tools use Major Arcana or shuffled spreads. This calculator uses two birthdays in the Cardology 52-card playing-card system: fixed birth cards plus Life Path roles. Related Destiny Cards / Love Cards names point at the same deck family. We publish the method so you can check the math instead of trusting us. See the Destiny Cards synonym map and the Cardology vs tarot page.",
  },
  {
    q: "Does same suit mean better compatibility?",
    a: "No. Same suit can feel familiar. It can also mean two people with the same blind spot, standing in it together. Read role landings (Venus, Mars, Saturn, Pluto, etc.) before treating suit match as a score.",
  },
  {
    q: "What is a Life Path constitution?",
    a: "Moon support plus 13 Life Path cards from the birth card in the Life Spread. Mental, love, action, growth, lesson, shadow, reward, responsibility, embodiment, and command lines. A lot of lines. You have all of them.",
  },
  {
    q: "Can Cardology decide whether a relationship should continue?",
    a: "It can name patterns. Where two people bond. Where they trigger each other. What each one tends to need and not ask for. The decision still belongs to the people living it. Reflection and entertainment. Not a verdict, and not permission.",
  },
  {
    q: "Should I compare ruling cards too?",
    a: "Yes, when you can. Birth cards show the core pattern. Ruling cards color day-to-day expression and attraction. Start with birthdays here, then open each card’s full page.",
  },
  {
    q: "Where can I browse every pair without entering dates?",
    a: "Use the compatibility directory of card hubs and pair pages, or the Cardology compatibility guide for method context. Browse every pairing. Pretend it is research.",
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
        { label: "Compatibility guide", href: "/cardology-compatibility" },
        { label: "Calculator", href: "/birth-card-compatibility-calculator" },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="compat-page">
      <h1 className="display">Birth Card Compatibility Calculator</h1>
      <p className="compat-lead mt-4 mb-8">
        Two birthdays in. Both playing-card birth cards, each Life Path, and where the other person lands in yours.
      </p>

      <CompatibilityCalculator />

      <section className="compat-panel" aria-label="Quick answer">
        <p data-ai-summary>
          Enter two birthdays to compare <strong>playing-card birth cards</strong>, each
          Life Path constitution, where the other person lands in your spectrum, and
          which Life Path cards you share. Free. Deterministic. Not a tarot shuffle.
          Same two dates, same answer, no matter how many times you check.
        </p>
        <p>
          Read each person&rsquo;s result in both directions. Then open the matching
          pair guide. The interpretation offers questions for reflection. It does
          not grade your relationship or tell you how it ends. The{" "}
          <Link href="/#chemistry-check" className="editorial-link">
            Chemistry Check, $24,
          </Link>{" "}
          is a personal reading of both people’s cards, shared strengths, and recurring friction. The specific friction. The fight you keep having about plans.
        </p>
      </section>

      <section aria-labelledby="not-tarot">
        <h2 id="not-tarot">Playing cards, not tarot.</h2>
        <p className="prose-reading mt-3">
          Compare two birthdays in a standard 52-card deck: Hearts, Clubs, Diamonds,
          Spades. This is <strong>not</strong> a tarot love spread or Major Arcana pair
          tool. Same two dates always return the same birth cards and Life Path map.
          No reshuffling until you like it.
        </p>
        <p className="mt-3 compat-links">
          <Link href="/cardology-vs-tarot" className="editorial-link">
            How Cardology differs from tarot
          </Link>
          <Link href="/destiny-cards" className="editorial-link">
            Destiny Cards &amp; Love Cards explained
          </Link>
        </p>
      </section>

      <section aria-labelledby="after-compare">
        <h2 id="after-compare">After you compare</h2>
        <p className="prose-reading mt-3">
          Browse the full matrix of hubs and pairs. Or run one birthday through the
          birth card calculator if you only know one person so far. That person is
          usually you.
        </p>
        <div className="mt-4 compat-links">
          <a href={COMPATIBILITY_DIRECTORY_PATH} className="paper-button">All pairings</a>
          <Link href="/birth-card-calculator" className="paper-button">Birth card calculator</Link>
        </div>
      </section>

      <section aria-labelledby="how-to-read">
        <h2 id="how-to-read">How to read the result</h2>
        <p className="prose-reading mt-3">
          Start with birth-card chemistry. Then the Life Path cross-reference. If the
          other person&rsquo;s birth card lands in your Venus, Mars, Saturn, Neptune, or
          Pluto position, the relationship feels different than if it lands nowhere in
          the first spectrum. Saturn feels like homework. Mars feels like a debate you
          didn&rsquo;t schedule. Shared Life Path cards show where both people carry the
          same card in different roles. Method overview:{" "}
          <Link href="/cardology-compatibility" className="editorial-link">
            how Cardology compatibility works
          </Link>
          .
        </p>
      </section>

      <section aria-labelledby="compat-faq">
        <h2 id="compat-faq">Frequently asked questions</h2>
        <div className="compat-faq mt-4">
          {faqs.map((faq) => (
            <div key={faq.q}>
              <h3>{faq.q}</h3>
              <p>{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="compat-related">
        <h2 id="compat-related">Related pages</h2>
        <ul className="compat-related mt-4">
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
              <Link href={href} className="editorial-link">
                {label}
              </Link>
            </li>
          ))}
          <li>
            <a href={COMPATIBILITY_DIRECTORY_PATH} className="editorial-link">
              Browse every card pairing
            </a>
          </li>
          <li>
            <a href={BIRTHDAY_DIRECTORY_PATH} className="editorial-link">
              Birthdays by date
            </a>
          </li>
        </ul>
      </section>

      <section aria-label="Next step">
      <StanReadingCta />
      </section>
      </div>
    </SeoShell>
  );
}
