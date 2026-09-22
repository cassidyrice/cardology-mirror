import type { Metadata } from "next";
import Link from "next/link";

import { CompatibilityCalculator } from "@/components/seo/CompatibilityCalculator";
import { FreeCourseCta } from "@/components/free-course/FreeCourseCta";
import { SeoHeroFan } from "@/components/seo/SeoHeroFan";
import { SeoShell } from "@/components/seo/SeoShell";
import { BIRTHDAY_DIRECTORY_PATH, COMPATIBILITY_DIRECTORY_PATH, SITE_NAME } from "@/lib/site";

const TITLE = "Cardology Compatibility Calculator: 1,378 Birth Card Pairs";
const DESCRIPTION =
  "See how two Cardology birth cards interact — suits, Life Path roles, shared cards — then compare two birthdays free (playing cards, not tarot).";

const OG_IMAGE = { url: "/og/cardology-compatibility.png", width: 1200, height: 630, alt: "Are your cards compatible? Two playing cards side by side" };

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/cardology-compatibility" },
  openGraph: {
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    url: "/cardology-compatibility",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

const faqs = [
  {
    q: "Are Love Cards and Cardology compatibility the same thing?",
    a: "Nearly. Love Cards is Robert Lee Camp's 1997 book (Sourcebooks) on birth-card compatibility, and the connection types it names are the ones most calculators — including this one — work from. Cardology is the wider system the book draws on; compatibility is one layer of it.",
  },
  {
    q: "What is Cardology compatibility?",
    a: "It is a map of how two fixed playing-card birth cards interact — suit domains, ranks, and where each person’s card lands in the other’s Life Path constitution — not a single yes/no score.",
  },
  {
    q: "How do I check Cardology compatibility free?",
    a: "Open the free Cardology compatibility calculator (two birthdays → birth cards + Life Path map), or browse the compatibility directory of card hubs and pair pages. Playing-card Cardology — not a tarot love reading.",
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

      <SeoHeroFan codes={["Q♦", "A♥"]} className="mb-5" />
      <h1 className="display mb-3 text-3xl text-brand-ink">Cardology Compatibility: Two Birth Cards, One Map</h1>
      <p className="mb-4 text-sm text-brand-ink-soft">
        Free Cardology compatibility calculator: two birthdays, two birth cards, Life Path roles. Playing cards, not tarot.
      </p>

      <CompatibilityCalculator />

      <div className="mb-6 mt-8 rounded-2xl border border-brand-line bg-brand-ivory/70 p-5" data-ai-summary>
        <p className="eyebrow mb-2 !text-brand-bronze">Direct answer</p>
        <p className="prose-reading text-brand-ink-soft">
          Cardology compatibility compares two birthday-locked playing cards and the
          Life Path roles underneath them — where you land in each other&rsquo;s map —
          rather than a single compatibility percentage.
        </p>
      </div>
      <p className="prose-reading mb-6 text-brand-ink-soft">
        Start with two birth cards, then go sharper with the Life Path. The useful
        question is not only &ldquo;are these cards compatible?&rdquo; It is: where does this
        person land in my constitution, where do I land in theirs, and which cards
        are we both carrying in different roles?{" "}
        <a href={COMPATIBILITY_DIRECTORY_PATH} className="text-brand-oxblood underline underline-offset-4">
          Browse every card pairing
        </a>
        .
      </p>

      <section className="mt-10">
        <h2 className="eyebrow mb-2 !text-brand-bronze">What a connection actually means</h2>
        <p className="prose-reading text-brand-ink-soft">
          Two cards in the same suit tend to share a first instinct — both lead from
          relationships, values, mind, or will. Different suits lead from different
          places, which can be friction or balance depending on awareness. The Life
          Path layer shows role: Venus can feel beloved, Mars provocative, Saturn like
          a lesson, Neptune like a dream, Pluto like a shadow you would rather not name.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 !text-brand-bronze">The Life Path layer</h2>
        <p className="prose-reading text-brand-ink-soft">
          The Life Path is a constitution, not a single label. It includes Moon support
          plus 13 cards: Primary, Mercury, Venus, Mars, Jupiter, Saturn, Uranus,
          Neptune, Pluto, Princess, Prince, Queen, and King. Compatibility gets more
          useful when you cross-reference those positions between two birthdates.
        </p>
      </section>

      <section className="mt-8" id="love-cards">
        <h2 className="eyebrow mb-2 !text-brand-bronze">Is this the same as Love Cards?</h2>
        <p className="prose-reading text-brand-ink-soft">
          Largely, yes — and the book is worth naming. <em>Love Cards</em> (Robert Lee
          Camp, Sourcebooks, 1997) is where most people first meet birth-card
          compatibility: connection types read card by card, mutual and one-way
          readings, and the relationship index that calculators like this one mirror.
          Camp&rsquo;s earlier <em>The Cards of Your Destiny</em> (1992) carries the
          yearly-spread machinery behind the timing layer. Both sit on the same 1893
          and 1947 source texts this site works from, with publisher and catalogue
          record in the{" "}
          <Link href="/cardology-books" className="text-brand-oxblood underline underline-offset-4">
            books and decks directory
          </Link>
          .
        </p>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          What is different here: the comparison runs on your two birthdays rather
          than on a lookup table, it shows every position rather than one verdict, and
          it says when a pairing is simply unremarkable — which a book chapter cannot
          do and a compatibility score usually will not.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 !text-brand-bronze">The four suits, four instincts</h2>
        <ul className="prose-reading space-y-1.5 text-brand-ink-soft">
          <li><span className="text-[#8e321f]">♥ Hearts</span> — relationships &amp; emotion</li>
          <li><span className="text-[#8e321f]">♦ Diamonds</span> — values &amp; resources</li>
          <li><span className="text-[#14110d]">♣ Clubs</span> — mind &amp; communication</li>
          <li><span className="text-[#14110d]">♠ Spades</span> — work, will &amp; transformation</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 !text-brand-bronze">Start with yourself</h2>
        <p className="prose-reading text-brand-ink-soft">
          Compatibility makes more sense once you understand your own card first.{" "}
          <Link href="/birth-card-calculator" className="text-brand-oxblood underline underline-offset-4">
            Find your birth card
          </Link>
          , read the{" "}
          <Link href="/birth-card" className="text-brand-oxblood underline underline-offset-4">
            52 Cardology card meanings
          </Link>
          , look up any date in the{" "}
          <a href={BIRTHDAY_DIRECTORY_PATH} className="text-brand-oxblood underline underline-offset-4">
            birthday calendar
          </a>
          , then read{" "}
          <Link href="/birth-card-vs-ruling-card" className="text-brand-oxblood underline underline-offset-4">
            how the birth card and ruling card differ
          </Link>
          .
        </p>
      </section>

      <section className="mt-10">
        <h2 className="eyebrow mb-4 !text-brand-bronze">Compatibility FAQ</h2>
        <div className="space-y-4">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-2xl border border-brand-line bg-brand-ivory/70 p-4">
              <h3 className="font-serif text-lg text-brand-ink">{f.q}</h3>
              <p className="prose-reading mt-2 text-sm text-brand-ink-soft">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

            <FreeCourseCta source="compatibility" className="mt-10" />
    </SeoShell>
  );
}
