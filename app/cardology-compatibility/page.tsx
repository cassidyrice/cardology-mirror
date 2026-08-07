import type { Metadata } from "next";
import Link from "next/link";
import { FreeCourseCta } from "@/components/free-course/FreeCourseCta";
import { SeoShell } from "@/components/seo/SeoShell";
import { ReadingBridge } from "@/components/seo/ReadingBridge";
import { BIRTHDAY_DIRECTORY_PATH, COMPATIBILITY_DIRECTORY_PATH, SITE_NAME } from "@/lib/site";

const TITLE = "Cardology Compatibility: Birth Cards & Life Paths";
const DESCRIPTION =
  "How Cardology compatibility works: two birth cards, Life Path roles, shared cards, suit dynamics, and free tools to compare any two birthdays.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/cardology-compatibility" },
  openGraph: {
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    url: "/cardology-compatibility",
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Card Blueprints" }],
  },
};

const faqs = [
  {
    q: "What is Cardology compatibility?",
    a: "It is a map of how two fixed playing-card birth cards interact — suit domains, ranks, and where each person’s card lands in the other’s Life Path constitution — not a single yes/no score.",
  },
  {
    q: "How do I check Cardology compatibility free?",
    a: "Use the two-birthday compatibility calculator, or browse the compatibility directory of card hubs and pair pages. Both are free on Card Blueprints.",
  },
  {
    q: "Is Cardology relationship compatibility the same as astrology synastry?",
    a: "No. Astrology compares planetary charts. Cardology compares birthday-locked playing cards and Life Path roles. Different inputs, different language.",
  },
];

export default function CompatibilityPage() {
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "Compatibility", href: "/cardology-compatibility" }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <h1 className="display mb-3 text-3xl text-bone">Cardology Compatibility</h1>
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5" data-ai-summary>
        <p className="eyebrow mb-2 text-gold">Direct answer</p>
        <p className="prose-reading text-mist">
          Cardology compatibility compares two birthday-locked playing cards and the
          Life Path roles underneath them — where you land in each other&rsquo;s map —
          rather than a single compatibility percentage.
        </p>
      </div>
      <p className="prose-reading mb-6 text-mist">
        Start with two birth cards, then go sharper with the Life Path. The useful
        question is not only &ldquo;are these cards compatible?&rdquo; It is: where does this
        person land in my constitution, where do I land in theirs, and which cards
        are we both carrying in different roles?
      </p>

      <div className="card-surface rounded-2xl border border-gold/25 p-5">
        <p className="font-serif text-base text-bone">Compare two birthdays free</p>
        <p className="mt-1 text-sm text-faint">
          Birth cards, Life Path constitutions, shared cards, and cross-reference roles.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link
            href="/birth-card-compatibility-calculator"
            className="inline-block rounded-full bg-foil px-5 py-2 font-serif text-sm text-ink"
          >
            Open the compatibility calculator →
          </Link>
          <a
            href={COMPATIBILITY_DIRECTORY_PATH}
            className="inline-block rounded-full border border-gold/30 px-5 py-2 font-serif text-sm text-gold"
          >
            Browse every card pairing →
          </a>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="eyebrow mb-2 text-gold">What a connection actually means</h2>
        <p className="prose-reading text-mist">
          Two cards in the same suit tend to share a first instinct — both lead from
          relationships, values, mind, or will. Different suits lead from different
          places, which can be friction or balance depending on awareness. The Life
          Path layer shows role: Venus can feel beloved, Mars provocative, Saturn like
          a lesson, Neptune like a dream, Pluto like a shadow you would rather not name.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">The Life Path layer</h2>
        <p className="prose-reading text-mist">
          The Life Path is a constitution, not a single label. It includes Moon support
          plus 13 cards: Primary, Mercury, Venus, Mars, Jupiter, Saturn, Uranus,
          Neptune, Pluto, Princess, Prince, Queen, and King. Compatibility gets more
          useful when you cross-reference those positions between two birthdates.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">The four suits, four instincts</h2>
        <ul className="prose-reading space-y-1.5 text-mist">
          <li><span className="text-[#8e321f]">♥ Hearts</span> — relationships &amp; emotion</li>
          <li><span className="text-[#8e321f]">♦ Diamonds</span> — values &amp; resources</li>
          <li><span className="text-[#14110d]">♣ Clubs</span> — mind &amp; communication</li>
          <li><span className="text-[#14110d]">♠ Spades</span> — work, will &amp; transformation</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">Start with yourself</h2>
        <p className="prose-reading text-mist">
          Compatibility makes more sense once you understand your own card first.{" "}
          <Link href="/birth-card-calculator" className="text-gold underline underline-offset-4">
            Find your birth card
          </Link>
          , look up any date in the{" "}
          <a href={BIRTHDAY_DIRECTORY_PATH} className="text-gold underline underline-offset-4">
            birthday calendar
          </a>
          , then read{" "}
          <Link href="/birth-card-vs-ruling-card" className="text-gold underline underline-offset-4">
            how the birth card and ruling card differ
          </Link>
          .
        </p>
      </section>

      <section className="mt-10">
        <h2 className="eyebrow mb-4 text-gold">Compatibility FAQ</h2>
        <div className="space-y-4">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h3 className="font-serif text-lg text-bone">{f.q}</h3>
              <p className="prose-reading mt-2 text-sm text-mist">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="card-surface mt-8 rounded-2xl border border-gold/25 p-5">
        <p className="font-serif text-base text-bone">Want one person&rsquo;s full pattern in writing?</p>
        <p className="mt-2 text-sm text-mist">
          After a free comparison, the Personal Card Blueprint ($29) is the deepen for
          a single birthday — instant report, no phone call.
        </p>
        <Link
          href="/products/personal-card-blueprint"
          className="mt-3 inline-block rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-ink"
        >
          Personal Blueprint — $29
        </Link>
      </div>

      <FreeCourseCta source="compatibility" className="mt-10" />
      <ReadingBridge variant="relationship" className="mt-8" />
    </SeoShell>
  );
}
