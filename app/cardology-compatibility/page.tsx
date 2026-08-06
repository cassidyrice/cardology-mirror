import type { Metadata } from "next";
import Link from "next/link";
import { SeoShell } from "@/components/seo/SeoShell";
import { ReadingBridge } from "@/components/seo/ReadingBridge";
import { BIRTHDAY_DIRECTORY_PATH, COMPATIBILITY_DIRECTORY_PATH, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cardology Compatibility: Birth Cards & Life Paths",
  description:
    "Compare birth cards, Life Path cards, shared cards, Venus and Mars chemistry, Saturn lessons, Pluto shadows, and relationship patterns.",
  alternates: { canonical: "/cardology-compatibility" },
  openGraph: {
    siteName: SITE_NAME,
    title: "Cardology Compatibility: Birth Cards and Life Paths",
    description: "Read the relationship through birth cards, Life Path cards, shared cards, and cross-referenced roles.",
    url: "/cardology-compatibility",
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Card Blueprints" }],
  },
};

export default function CompatibilityPage() {
  return (
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "Compatibility", href: "/cardology-compatibility" }]}>
      <h1 className="display mb-3 text-3xl text-bone">Cardology Compatibility</h1>
      <p className="prose-reading mb-6 text-mist">
        Cardology compatibility starts with two birth cards, then gets sharper when
        you read the Life Path underneath each person. The question is not just
        &ldquo;are these cards compatible?&rdquo; The better question is: where does this person
        land in my constitution, where do I land in theirs, and which cards are we
        both carrying in different roles?
      </p>

      <div className="card-surface rounded-2xl p-5">
        <p className="font-serif text-base text-bone">Compare two birthdays</p>
        <p className="mt-1 text-sm text-faint">
          See birth cards, Life Path constitutions, shared cards, and cross-reference roles.
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
          Two cards in the same suit tend to share a first instinct — both lead
          from relationships, or values, or mind, or will. Cards in different
          suits lead from different places, which can be friction or balance
          depending on how aware each person is of the difference. The Life Path
          layer shows the deeper role: a person can land in your Venus and feel
          beloved, your Mars and feel provocative, your Saturn and feel like a
          lesson, your Neptune and feel like a dream, or your Pluto and expose the
          shadow you would rather not name.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">The Life Path layer</h2>
        <p className="prose-reading text-mist">
          The Life Path is a constitution, not a single label. It includes Moon
          support plus 13 cards: Primary, Mercury, Venus, Mars, Jupiter, Saturn,
          Uranus, Neptune, Pluto, Princess, Prince, Queen, and King. Compatibility
          gets more useful when you cross-reference those positions between two
          birthdates.
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
          Compatibility makes more sense once you understand your own card first.
          {" "}
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

      <ReadingBridge variant="relationship" className="mt-10" />
    </SeoShell>
  );
}
