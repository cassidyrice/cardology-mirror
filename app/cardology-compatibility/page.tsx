import type { Metadata } from "next";
import Link from "next/link";

import { CompatibilityCalculator } from "@/components/seo/CompatibilityCalculator";
import { StanReadingCta } from "@/components/seo/StanReadingCta";
import { SeoHeroFan } from "@/components/seo/SeoHeroFan";
import { SeoShell } from "@/components/seo/SeoShell";
import { BIRTHDAY_DIRECTORY_PATH, COMPATIBILITY_DIRECTORY_PATH, SITE_NAME } from "@/lib/site";

const TITLE = "Cardology Compatibility Calculator: 1,378 Birth Card Pairs";
const DESCRIPTION =
  "Cardology compatibility for two birth cards: suits, Life Path roles, shared cards. Where you clash and why. Compare two birthdays free. Not tarot.";

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
    a: "Nearly. Love Cards is Robert Lee Camp's 1997 book (Sourcebooks) on birth-card compatibility. The connection types it names are the ones most calculators work from, this one included. Cardology is the wider system the book draws on. Compatibility is one layer of it.",
  },
  {
    q: "What is Cardology compatibility?",
    a: "It is a map of how two fixed playing-card birth cards interact: suit domains, ranks, and where each person’s card lands in the other’s Life Path constitution. It is not a yes/no score. Nobody gets a percentage to screenshot.",
  },
  {
    q: "How do I check Cardology compatibility free?",
    a: "Open the free Cardology compatibility calculator (two birthdays → birth cards + Life Path map), or browse the compatibility directory of card hubs and pair pages. Playing-card Cardology. Not a tarot love reading. Nobody is shuffling for you.",
  },
  {
    q: "Is Cardology relationship compatibility the same as astrology synastry?",
    a: "No. Astrology compares planetary charts. Cardology compares birthday-locked playing cards and Life Path roles. Different inputs, different language. Same arguments about the dishes.",
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
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "Compatibility guide", href: "/cardology-compatibility" }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <SeoHeroFan codes={["Q♦", "A♥"]} className="mb-5" />
      <h1 className="display mb-3 text-3xl text-brand-ink">Cardology Compatibility: Two Birth Cards, One Map</h1>
      <section id="what-is-compatibility" className="mb-6 rounded-2xl border border-brand-line bg-brand-ivory/70 p-5" data-ai-summary>
        <h2 className="font-serif text-2xl text-brand-ink">What is Cardology compatibility?</h2>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          Cardology compatibility compares two birthday-locked playing cards and the
          Life Path roles underneath them. Where you land in each other&rsquo;s map.
          Not a single compatibility percentage. Same date, same card. Playing
          cards, not tarot. A mirror of how two patterns meet, not a forecast. It
          will not tell you if they&rsquo;re the one. It will tell you why you both
          go quiet at the same moment.
        </p>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          It is not astrology synastry. Different homework. That framing lives in{" "}
          <Link href="/52-card-astrology-explained" className="text-brand-oxblood underline underline-offset-4">
            52-card astrology explained
          </Link>
          . The birthday map itself is{" "}
          <Link href="/what-is-cardology" className="text-brand-oxblood underline underline-offset-4">
            what Cardology is
          </Link>
          . The free calculator below takes two birthdays. Yes, you can use theirs without asking.
        </p>
      </section>

      <CompatibilityCalculator />
      <StanReadingCta />
      <p className="prose-reading mb-6 mt-8 text-brand-ink-soft">
        Start with two birth cards. Then get specific with the Life Path. The
        useful question is not &ldquo;are these cards compatible?&rdquo; That one has no
        answer. Ask where this person lands in my constitution. Where I land in
        theirs. Which cards we are both carrying in different roles, and which one
        of us keeps putting theirs down first.{" "}
        <a href={COMPATIBILITY_DIRECTORY_PATH} className="text-brand-oxblood underline underline-offset-4">
          Browse every card pairing
        </a>
        . The same two-birthday form on its own page is the{" "}
        <Link href="/birth-card-compatibility-calculator" className="text-brand-oxblood underline underline-offset-4">
          birth card compatibility calculator
        </Link>
        . One hub in that directory is{" "}
        <a href="/compatibility/10-of-hearts" className="text-brand-oxblood underline underline-offset-4">
          10 of Hearts compatibility
        </a>
        .
      </p>

      <section className="mt-10">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">What a connection actually means</h2>
        <p className="prose-reading text-brand-ink-soft">
          Two cards in the same suit tend to share a first instinct. Both lead from
          relationships, values, mind, or will. Different suits lead from different
          places. That is friction or balance, depending on how awake you both are.
          The Life Path layer shows role. Venus can feel beloved. Mars, provocative.
          Saturn, like a lesson. Neptune, like a dream. Pluto, like a shadow you would
          rather not name out loud.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">The Life Path layer</h2>
        <p className="prose-reading text-brand-ink-soft">
          The Life Path is a constitution, not a single label. It includes Moon support
          plus 13 cards: Primary, Mercury, Venus, Mars, Jupiter, Saturn, Uranus,
          Neptune, Pluto, Princess, Prince, Queen, and King. Compatibility gets
          useful when you cross-reference those positions between two birthdates.
          Less &ldquo;we&rsquo;re both Hearts.&rdquo; More &ldquo;oh, that&rsquo;s why
          you do that.&rdquo;
        </p>
      </section>

      <section className="mt-8" id="love-cards">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">Is this the same as Love Cards?</h2>
        <p className="prose-reading text-brand-ink-soft">
          Largely, yes. The book deserves its credit. <em>Love Cards</em> (Robert Lee
          Camp, Sourcebooks, 1997) is where most people first meet birth-card
          compatibility. Connection types read card by card, mutual and one-way
          readings, and the relationship index that calculators like this one mirror.
          Camp&rsquo;s earlier <em>The Cards of Your Destiny</em> (1992) carries the
          yearly-spread machinery behind the timing layer. Both sit on the same 1893
          and 1947 source texts this site works from, with publisher and catalogue
          record in the{" "}
          <Link href="/cardology-books" className="text-brand-oxblood underline underline-offset-4">
            books and decks directory
          </Link>
          . The public name map for Destiny Cards, Love Cards, and Cards of Destiny is the{" "}
          <Link href="/destiny-cards" className="text-brand-oxblood underline underline-offset-4">
            Destiny Cards synonym map
          </Link>
          .
        </p>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          What is different here. The comparison runs on your two birthdays, not a
          lookup table. It shows every position, not one verdict. And it says when a
          pairing is simply unremarkable. A book chapter cannot do that. A
          compatibility score usually won&rsquo;t. Sometimes the answer is &ldquo;fine.
          Two people. Normal amount of friction.&rdquo;
        </p>
      </section>

      <section className="mt-8">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">The four suits, four instincts</h2>
        <ul className="prose-reading space-y-1.5 text-brand-ink-soft">
          <li><span className="text-[#8e321f]">♥ Hearts</span>: relationships &amp; emotion</li>
          <li><span className="text-[#8e321f]">♦ Diamonds</span>: values &amp; resources</li>
          <li><span className="text-[#14110d]">♣ Clubs</span>: mind &amp; communication</li>
          <li><span className="text-[#14110d]">♠ Spades</span>: work, will &amp; transformation</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">Start with yourself</h2>
        <p className="prose-reading text-brand-ink-soft">
          Compatibility makes more sense once you understand your own card first.
          You are half of the problem. Statistically.{" "}
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

      <section className="mt-10" aria-labelledby="compatibility-conversation">
        <h2 id="compatibility-conversation" className="font-serif text-xl text-brand-ink">Turn the result into a conversation</h2>
        <p className="prose-reading mt-4 text-brand-ink-soft">
          Read both birth cards before you interpret anything. Pick one difference
          you actually recognize: how you ask for support, make plans, discuss
          money, or handle disagreement. Each person names one recent example. Then
          one change they would find helpful. Not a list. One. Use the cards to
          start the conversation. Let your actual experience decide whether the
          interpretation fits. Do not use the result to win an argument.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="type-eyebrow mb-4 !text-brand-bronze">Compatibility FAQ</h2>
        <div className="space-y-4">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-2xl border border-brand-line bg-brand-ivory/70 p-4">
              <h3 className="font-serif text-lg text-brand-ink">{f.q}</h3>
              <p className="prose-reading mt-2 text-sm text-brand-ink-soft">{f.a}</p>
            </div>
          ))}
        </div>
      </section>
    </SeoShell>
  );
}
