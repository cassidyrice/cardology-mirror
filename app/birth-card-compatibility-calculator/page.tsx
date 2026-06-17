import type { Metadata } from "next";
import Link from "next/link";
import { SeoShell } from "@/components/seo/SeoShell";
import { CompatibilityCalculator } from "@/components/seo/CompatibilityCalculator";
import { SITE_URL, VIDEO_PATH } from "@/lib/site";

export const metadata: Metadata = {
  title: "Birth Card Compatibility Calculator — Compare Two Cards",
  description:
    "Free birth card compatibility calculator. Enter two birthdays to see both Cardology birth cards and how their patterns connect.",
  alternates: { canonical: "/birth-card-compatibility-calculator" },
  openGraph: {
    title: "Birth Card Compatibility Calculator",
    description: "Enter two birthdays to see both birth cards and how their patterns connect.",
    url: "/birth-card-compatibility-calculator",
  },
};

const faqs = [
  {
    q: "Does same suit mean better compatibility?",
    a: "No. Same suit can feel familiar, but it can also amplify the same blind spots.",
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
          The birth card compatibility calculator converts two birthdays into
          Cardology birth cards, then compares whether the cards share a suit or lead
          from different life domains. Use it to read attraction, friction, support,
          blind spots, and why the dynamic may feel the way it does.
        </p>
      </div>
      <p className="prose-reading mb-6 text-mist">
        Enter two birthdays to find both <strong>birth cards</strong> and a first
        read on how they actually connect: what feels natural, what gets tense, and
        where each person may be speaking a different symbolic language. For the
        broader picture of where two patterns share a language and where they grind,
        use the compatibility guide and each card meaning page.
      </p>

      <CompatibilityCalculator />

      <section className="mt-10">
        <h2 className="eyebrow mb-2 text-gold">How to read the result</h2>
        <p className="prose-reading text-mist">
          The calculator shows each person&rsquo;s birth card and whether they share
          a suit. Same suit means a shared first instinct; different suits mean
          you lead from different places. It&rsquo;s a starting point for reading the
          dynamic with more precision —
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
