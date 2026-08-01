import type { Metadata } from "next";
import Link from "next/link";
import { SeoShell } from "@/components/seo/SeoShell";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "The Joker: The December 31 Birth Card",
  description:
    "December 31 is the only birthday that does not map to one of the 52 cards. The formula resolves it to zero — the Joker. Here is why, and what it means.",
  alternates: { canonical: "/birth-card/joker" },
  openGraph: {
    siteName: SITE_NAME,
    title: "The Joker: The December 31 Birth Card",
    description: "December 31 resolves to zero — the one date outside the 52-card cycle.",
    url: "/birth-card/joker",
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Card Blueprints" }],
  },
};

export default function JokerPage() {
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is the birth card for December 31?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "December 31 is the Joker. The formula Solar Value = 55 − (2 × Month + Day) gives 55 − (24 + 31) = 0, and zero sits outside the 1–52 range that maps to the standard deck. It is the only calendar date that resolves this way.",
        },
      },
      {
        "@type": "Question",
        name: "Why doesn't December 31 get one of the 52 cards?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Because the arithmetic runs out. The values descend across the year — December 30 resolves to 1, the Ace of Hearts, the lowest card in the sequence. December 31 is one step further, which is zero. There is no fifty-third card to assign, so the date falls outside the cycle.",
        },
      },
      {
        "@type": "Question",
        name: "How many days actually map to a card?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "364 of the 365 calendar dates map to the 52 cards. December 31 resolves to the Joker, and February 29 is not part of the cycle at all. The often-repeated claim that 365 days map to 52 cards is wrong by those two cases.",
        },
      },
      {
        "@type": "Question",
        name: "Can I get a reading if I was born on December 31?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The standard card readings are built on the 52-card structure, so they do not apply to a Joker birthday. Contact us before purchasing and we will tell you exactly what we can and cannot do with a December 31 birthdate.",
        },
      },
    ],
  };

  return (
    <SeoShell
      crumb={[
        { label: "Home", href: "/" },
        { label: "Birth Cards", href: "/birth-card" },
        { label: "The Joker", href: "/birth-card/joker" },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />

      <h1 className="display mb-3 text-3xl text-bone">The Joker: The December 31 Birth Card</h1>

      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5" data-ai-summary>
        <p className="eyebrow mb-2 text-gold">Direct answer</p>
        <p className="prose-reading text-mist">
          December 31 is the only birthday in the year that does not map to one of the 52 cards.
          The formula resolves it to zero, and zero is the Joker — the card outside the deck&rsquo;s
          ordered sequence.
        </p>
      </div>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">The arithmetic</h2>
        <p className="prose-reading text-mist">
          Every date runs through the same formula:{" "}
          <strong>Solar Value = 55 − (2 × Month + Day)</strong>. For December 31 that is
          55 − (2 × 12 + 31) = 55 − 55 = <strong>0</strong>. The cards occupy values 1 through 52,
          so zero has nowhere to land in the standard deck.
        </p>
        <p className="prose-reading mt-3 text-mist">
          You can see it clearly by looking at the last two days of the year side by side. December 30
          gives 55 − (24 + 30) = 1, the Ace of Hearts — the first card in the sequence. One day later
          the value steps down again, and there is nothing below the Ace. That is the edge of the system.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">Why this is the honest number</h2>
        <p className="prose-reading text-mist">
          A lot of Cardology writing says &ldquo;52 cards for 365 days.&rdquo; That is wrong by two
          cases. <strong>364</strong> of the 365 calendar dates map to a card. December 31 resolves to
          the Joker, and February 29 is not in the cycle at all. We would rather state the exception
          than round it away — the system is more interesting when you can see where it ends.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">What a Joker birthday means here</h2>
        <p className="prose-reading text-mist">
          It means the standard card structure does not describe you, and we are not going to pretend
          otherwise. The 52-card material — birth card, ruling card, life spread positions, compatibility
          by position — is all built on values 1 through 52. None of it resolves for a value of zero.
        </p>
        <p className="prose-reading mt-3 text-mist">
          If you were born on December 31 and you want a reading,{" "}
          <Link href="/contact" className="text-gold underline underline-offset-4">
            get in touch first
          </Link>{" "}
          rather than buying one. We will tell you plainly what can and cannot be done with a Joker
          birthdate before any money changes hands.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">The two rarest ordinary birthdays</h2>
        <p className="prose-reading text-mist">
          The Joker sits just past the two rarest cards in the system. January 1 computes to 52 — the{" "}
          <Link href="/birth-card/king-of-spades" className="text-gold underline underline-offset-4">
            King of Spades
          </Link>
          , held by that one date alone. December 30 computes to 1 — the{" "}
          <Link href="/birth-card/ace-of-hearts" className="text-gold underline underline-offset-4">
            Ace of Hearts
          </Link>
          , also a single date. Every other card covers between 2 and 12 birthdays.
        </p>
      </section>

      <div className="card-surface mt-8 rounded-2xl p-5">
        <p className="font-serif text-base text-bone">Not born December 31?</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/birth-card-calculator" className="rounded-full border border-white/15 px-4 py-2 text-sm text-mist hover:text-bone">
            Find your birth card
          </Link>
          <Link href="/birth-card" className="rounded-full border border-white/15 px-4 py-2 text-sm text-mist hover:text-bone">
            Browse all 52 cards
          </Link>
        </div>
      </div>
    </SeoShell>
  );
}
