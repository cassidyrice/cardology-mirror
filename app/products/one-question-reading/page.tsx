import type { Metadata } from "next";
import Link from "next/link";

import { DeepDiveCta } from "@/components/seo/DeepDiveCta";
import { SeoHeroFan } from "@/components/seo/SeoHeroFan";
import { SeoShell } from "@/components/seo/SeoShell";
import {
  DEEP_DIVE_PRICE_LABEL,
  DEEP_DIVE_PRODUCT_NAME,
  DEEP_DIVE_PRODUCT_PATH,
  DEEP_DIVE_REVIEW_PATH,
  ONE_QUESTION_TURNAROUND,
} from "@/lib/deep-dive";
import { buildProductJsonLd } from "@/lib/product-schema";
import { DEEP_DIVE_PRODUCT } from "@/lib/products";
import { SITE_NAME } from "@/lib/site";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const TITLE = "One Question Reading ($13): Your Decision, Read From Your Birth Card";
const DESCRIPTION =
  "Ask one question. Get a written Cardology reading built from your birth card, this year's Long Range and Pluto cards, and the card you owe. About 600 words in plain language, emailed within about a minute. $13, one payment.";
const OG_IMAGE = "/og/products/one-question-reading.png";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "cardology reading",
    "one question reading",
    "birth card reading",
    "cardology question",
    "written card reading",
    "playing card reading",
  ],
  alternates: { canonical: DEEP_DIVE_PRODUCT_PATH },
  openGraph: {
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    url: DEEP_DIVE_PRODUCT_PATH,
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "One Question Reading, $13. Ask one question, get it read from your birth card." }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

const faqs = [
  {
    q: "What do I get for $13?",
    a: "One written reading on one question. About 600 words in plain language: your birth card (the number and the suit), this year's Long Range card, this year's Pluto card and its payoff, the card you owe and the card you're owed, and how all of that lands on your question. It ends with three things to keep an eye out for over the next few weeks. Emailed as plain text. No login, nothing to download.",
  },
  {
    q: "How fast does it arrive?",
    a: "About a minute after payment. It appears on the page you land on after checkout and in the email you used. Your cards are calculated first, then the reading is written from them to my own spec.",
  },
  {
    q: "What makes a good question?",
    a: "One decision, in real words. 'Should I take the job in Denver or stay put?' reads better than 'career.' 'Do I keep pushing this business or wind it down?' reads better than 'money.' A yes-or-no question is fine. The reading will not answer yes or no for you; it shows you which yes and which no you have been circling, and lets you pick.",
  },
  {
    q: "Will it tell me what to do, or what will happen?",
    a: "No. It is a mirror, not a forecast. Same birthday, same cards, every time; what they mean beside your question is the part that takes a person. Nothing here predicts events, lucky days, or other people's choices.",
  },
  {
    q: "What if my birth date was wrong, or I want to reword the question?",
    a: "Reply to your receipt email before the reading is written and we fix it. December 31 is the Joker, the one birthday outside the 52-card map; the reading says so up front and reads the year from the Joker's position.",
  },
];

/** Excerpt of a real reading for an Eight of Diamonds who asked about a promotion. */
const SAMPLE = [
  "You're an 8 of Diamonds. Eights are power, mastery, the number of the achiever. Diamonds is money and worth, what a thing is worth to you and what you're worth to it. Put together, you tend to measure a decision like this in hard numbers first: what it pays, what it proves, what it protects. When that works, you move with real confidence, the kind that makes other people trust your judgment. When it slips, you turn the decision into a scoreboard, and you start treating your own value as something that only counts if it's being tested. Which version has been showing up when you think about this, the confident one or the scorekeeping one?",
  "The 8 of Diamonds in you wants proof before it moves, the Queen of Spades in you wants to stay in the grind because you've earned mastery there, and the 7 of Clubs in you already knows some of that caution is just fear wearing a practical coat. The promotion matches what Pluto is asking for, a new value project, untested ground. Staying matches the comfort of a role where your worth is already proven. Which one sounds like growth to you, and which one sounds like hiding in a job well done?",
];

export default function OneQuestionReadingPage() {
  const jsonLd = [
    buildProductJsonLd(DEEP_DIVE_PRODUCT),
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];

  return (
    <SeoShell
      crumb={[
        { label: "Home", href: "/" },
        { label: DEEP_DIVE_PRODUCT_NAME, href: DEEP_DIVE_PRODUCT_PATH },
      ]}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <SeoHeroFan codes={["8♦", "Q♠", "7♣"]} className="mb-5" />
      <p className="type-eyebrow mb-3 !text-brand-bronze">
        One question · {DEEP_DIVE_PRICE_LABEL} · written within {ONE_QUESTION_TURNAROUND}
      </p>
      <h1 className="display mb-3 text-3xl text-brand-ink">Ask one question.</h1>
      <p className="prose-reading mb-6 max-w-[38em] text-brand-ink-soft">
        You bring the one thing you keep circling. I read it from your birth
        card, this year&rsquo;s cards, and the card you owe. You get about 600
        words that sound like your own thinking, only clearer, and three things
        to keep an eye out for.
      </p>

      <div className="mb-10 flex flex-col items-start gap-3">
        <DeepDiveCta placement="product-page" source="product-page" showFulfillment={false} />
        <p className="text-sm text-brand-ink-soft">
          Know your birthday, obviously. Have the question ready in one sentence.{" "}
          <Link href={DEEP_DIVE_REVIEW_PATH} className="text-brand-oxblood underline underline-offset-4">
            Or type both on the next page →
          </Link>
        </p>
      </div>

      <section className="mt-10">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">What the reading is made of</h2>
        <p className="prose-reading text-brand-ink-soft">
          Seven pieces, always in this order. Your birth card&rsquo;s number (the
          action) and its suit (the area of life it acts in). This year&rsquo;s
          Long Range card, the thing that keeps pulling your attention. This
          year&rsquo;s Pluto card and its payoff: what the year asks, what it
          pays. The card you owe, which is how this kind of question tends to go
          wrong for you. The card you&rsquo;re owed, which is what works without
          trying. And your question, which all of it lands on.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">A piece of one</h2>
        <p className="mb-4 text-sm text-brand-ink-soft">
          From a reading for an Eight of Diamonds who asked about a promotion.
        </p>
        <blockquote className="space-y-4 border-l-2 border-brand-line pl-5">
          {SAMPLE.map((para) => (
            <p key={para.slice(0, 24)} className="prose-reading text-brand-ink">
              {para}
            </p>
          ))}
        </blockquote>
      </section>

      <section className="mt-10">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">How it works</h2>
        <p className="prose-reading text-brand-ink-soft">
          You type your birth date and your question, then pay {DEEP_DIVE_PRICE_LABEL} on
          Stripe. I pull your cards. Same birthday, same cards, every time, and
          you can check the math yourself. I write the reading and send it to
          the email you used at checkout within {ONE_QUESTION_TURNAROUND}. Plain
          text. Read it once, then watch the next few weeks.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">What it is not</h2>
        <p className="prose-reading text-brand-ink-soft">
          A mirror, not a forecast. It will not tell you what to do, and it
          will not predict what happens. It shows you the pattern you are
          already running, where you are standing in the year, and the two ways
          your question tends to go. You will know which one is you.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="type-eyebrow mb-2 !text-brand-bronze">Not sure of your card?</h2>
        <p className="prose-reading text-brand-ink-soft">
          <Link href="/birth-card-calculator" className="text-brand-oxblood underline underline-offset-4">
            Find your birth card free
          </Link>
          . The same date always returns the same card, and the reading is
          built from that birthday.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="type-eyebrow mb-4 !text-brand-bronze">Questions people ask first</h2>
        <div className="space-y-4">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-2xl border border-brand-line bg-brand-ivory/70 p-4">
              <h3 className="font-serif text-lg text-brand-ink">{f.q}</h3>
              <p className="prose-reading mt-2 text-sm text-brand-ink-soft">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-10">
        <DeepDiveCta placement="product-page-bottom" source="product-page" />
      </div>
    </SeoShell>
  );
}
