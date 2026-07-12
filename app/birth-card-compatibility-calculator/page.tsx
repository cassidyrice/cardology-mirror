import type { Metadata } from "next";
import Link from "next/link";
import { SeoShell } from "@/components/seo/SeoShell";
import { CompatibilityCalculator } from "@/components/seo/CompatibilityCalculator";
import { ReadingBridge } from "@/components/seo/ReadingBridge";
import { SITE_URL, VIDEO_PATH } from "@/lib/site";

export const metadata: Metadata = {
  title: "Birth Card Compatibility Calculator — Life Path Cross-Reference",
  description:
    "Free Cardology compatibility calculator. Enter two birthdays to compare birth cards, Life Path constitutions, shared cards, and relationship cross-references.",
  alternates: { canonical: "/birth-card-compatibility-calculator" },
  openGraph: {
    title: "Birth Card Compatibility Calculator",
    description: "Enter two birthdays to compare birth cards, Life Path constitutions, shared cards, and relationship cross-references.",
    url: "/birth-card-compatibility-calculator",
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Card Blueprints" }],
  },
};

const faqs = [
  {
    q: "Does same suit mean better compatibility?",
    a: "No. Same suit can feel familiar, but it can also amplify the same blind spots.",
  },
  {
    q: "What is a Life Path constitution?",
    a: "It is the Moon support card plus the 13 Life Path cards starting from the birth card in the Life Spread. It shows the person's mental, love, action, growth, lesson, shadow, reward, responsibility, embodiment, and command lines.",
  },
  {
    q: "Can Cardology decide whether a relationship should continue?",
    a: "It can name the pattern with surprising clarity: where two people bond, where they trigger each other, and what each person tends to need. The actual decision still belongs to the people living it.",
  },
  {
    q: "Should I compare ruling cards too?",
    a: "Yes. Birth cards show the core pattern; ruling cards can show expression, attraction, and day-to-day style.",
  },
];

export default function CompatibilityCalculatorPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Birth Card Compatibility Calculator",
      description: metadata.description,
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
      <h1 className="display mb-3 text-3xl text-bone">Birth Card Compatibility Calculator</h1>
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5" data-ai-summary>
        <p className="eyebrow mb-2 text-gold">Quick answer</p>
        <p className="prose-reading text-mist">
          Enter two birthdays to see both birth cards, each person&rsquo;s Moon-plus-13
          Life Path constitution, where the other person&rsquo;s birth card lands inside
          that spectrum, and which Life Path cards both people share.
        </p>
      </div>
      <p className="prose-reading mb-6 text-mist">
        The first layer is simple: two birth cards meeting. The deeper layer is the
        Life Spread. Each person carries a spectrum: Moon support, primary birth-card
        energy, Mercury mind, Venus love, Mars action, Jupiter growth, Saturn lesson,
        Uranus pivot, Neptune dream, Pluto shadow, Princess reward, Prince
        responsibility, Queen embodiment, and King command.
      </p>

      <CompatibilityCalculator />

      <section className="mt-10">
        <h2 className="eyebrow mb-2 text-gold">How to read the result</h2>
        <p className="prose-reading text-mist">
          Start with the birth-card chemistry, then read the Life Path
          cross-reference. If the other person&rsquo;s birth card lands in your Venus,
          Mars, Saturn, Neptune, or Pluto position, the relationship will feel very
          different than if it lands nowhere in the first Life Path spectrum. Shared
          Life Path cards show where both people are carrying the same card in
          different roles. For the broader method,
          read more about{" "}
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
            <div key={faq.q}>
              <h3 className="font-serif text-base text-bone">{faq.q}</h3>
              <p className="prose-reading text-mist">{faq.a}</p>
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
            ["All 52 Birth Cards", "/birth-card"],
            ["Compatibility Beginner Guide", "/blog/cardology-compatibility-beginner-guide"],
            ["Cardology Videos", VIDEO_PATH],
          ].map(([label, href]) => (
            <li key={href}>
              <Link href={href} className="text-gold underline underline-offset-4">
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <ReadingBridge variant="relationship" className="mt-10" />

      <div className="card-surface mt-8 rounded-2xl p-5">
        <p className="font-serif text-base text-bone">Don&rsquo;t know your card yet?</p>
        <Link
          href="/birth-card-calculator"
          className="mt-3 inline-block rounded-full border border-gold/30 px-5 py-2 font-serif text-sm text-gold hover:border-gold"
        >
          Birth Card Calculator →
        </Link>
      </div>
    </SeoShell>
  );
}
