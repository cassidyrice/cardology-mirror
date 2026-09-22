import type { Metadata } from "next";
import Link from "next/link";

import { FreeCourseCta } from "@/components/free-course/FreeCourseCta";
import { SeoShell } from "@/components/seo/SeoShell";
import { TableScroll } from "@/components/seo/TableScroll";
import { BirthCardCalculator } from "@/components/seo/BirthCardCalculator";
import { BirthdayChartTable } from "@/components/seo/BirthdayChartTable";
import {
  BIRTHDAY_DIRECTORY_PATH,
  SITE_NAME,
} from "@/lib/site";
import { allCardSeo } from "@/lib/seo-cards";
import { PAGE_UPDATED_DATES } from "@/lib/page-dates";
import { updatedLabel } from "@/lib/page-updated";

const MONTH_DIRECTORY = [
  ["January", "january-1"],
  ["February", "february-1"],
  ["March", "march-1"],
  ["April", "april-1"],
  ["May", "may-1"],
  ["June", "june-1"],
  ["July", "july-1"],
  ["August", "august-1"],
  ["September", "september-1"],
  ["October", "october-1"],
  ["November", "november-1"],
  ["December", "december-1"],
] as const;

const TITLE = "Cardology Chart & Birth Card Calculator (Free)";
const DESCRIPTION =
  "Free Cardology chart + birth card calculator — all 366 birthdays → one playing card. Same date, same card. Not tarot.";
const REVIEWED_DATE = PAGE_UPDATED_DATES["/birth-card-calculator"];

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "birth card calculator",
    "cardology chart",
    "birth card chart",
    "playing card birth card calculator",
    "Cardology calculator",
    "cardology birthday calculator",
    "cardology chart calculator",
    "playing card astrology calculator",
    "what is my birth card",
    "what card am I based on my birthday",
    "birth card calculator playing cards",
    "birth card calculator not tarot",
    "playing cards birthday chart",
    "birthday playing card",
    "playing card for my birthday",
  ],
  alternates: { canonical: "/birth-card-calculator" },
  openGraph: {
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    url: "/birth-card-calculator",
    images: [
      {
        url: "/og/birth-card-calculator.png",
        width: 1200,
        height: 630,
        alt: "Find your birth card — Card Blueprints calculator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og/birth-card-calculator.png"],
  },
};

const faqs = [
  {
    q: "What is a birth card in Cardology?",
    a: "In Cardology, your birth card is the single playing card your birthday maps to in a fixed 52-card system. It is calculated from month and day, stays the same for life, and describes a default pattern — not a random tarot draw and not a paper birth announcement.",
  },
  {
    q: "Is this a tarot birth card calculator?",
    a: "No. Tarot birth cards use Major Arcana math from a 78-card tradition. This calculator uses a standard 52-card playing deck (Hearts, Clubs, Diamonds, Spades) in the Cardology system. If you want pairs like Death and the Emperor, use a tarot tool. If you want the playing card locked to your birthday, use this one — then read the Cardology vs tarot page for the longer split.",
  },
  {
    q: "How is the birth card calculated?",
    a: "It is a deterministic formula on birth month and day. The same birthday always produces the same card — no shuffle, no interpretation step, and nothing random. You can re-run it anytime and get the same result.",
  },
  {
    q: "Is this a Cardology birthday calculator or a chart calculator?",
    a: "Yes — same tool. Enter a birthday for the Cardology birth card (playing cards, not tarot). The Cardology chart on this page is the 52-card birthday map, also called a playing-cards birthday chart. Same date, same card.",
  },
  {
    q: "Does the birth year matter?",
    a: "Your birth card depends only on month and day. The year is used for timing layers and yearly spreads, not for the birth card itself.",
  },
  {
    q: "What is the difference between a birth card and a ruling card?",
    a: "The birth card is the core pattern. The planetary ruling card is the style it expresses through, selected by your zodiac sign’s ruling planet acting on your birth card’s position. Two people with the same birth card but different signs usually have different ruling cards.",
  },
  {
    q: "Is the free Cardology calculator private?",
    a: "The birth-card calculation runs in your browser. The calculator tracks anonymous start and completion events for site analytics, but it does not send the birthday itself in those events.",
  },
  {
    q: "Can two people have the same birth card?",
    a: "Yes. Most cards cover several birthdays. February 29 maps normally in the cycle (9 of Clubs). December 31 is the Joker boundary, sometimes called the Day Out of Time. The ruling-card layer often differs even when the birth card matches.",
  },
  {
    q: "Is this also called a Destiny Cards calculator?",
    a: "Destiny Cards is a related name used by some teachers and websites for birthday-to-playing-card systems. Card Blueprints calls the practice Cardology and documents its own deterministic calculation method. If two tools disagree, use the published method and repeat the same date to compare results. Came via Destiny Cards, Love Cards, or Science of the Cards? Read the Destiny Cards synonym map on this site.",
  },
];

export default function CalculatorPage() {
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const appLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Cardology Birth Card Calculator and Chart",
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: [
      "Playing-card birth card from birthday",
      "Planetary ruling card",
      "Visible Cardology birthday chart",
      "Links to all 52 card meanings",
      "Repeatable, deterministic result",
    ],
    author: { "@type": "Person", name: "Cassidy Rice", url: "https://cardblueprints.com/about" },
    publisher: { "@id": "https://cardblueprints.com/#organization" },
    dateModified: REVIEWED_DATE,
    description: DESCRIPTION,
    url: "https://cardblueprints.com/birth-card-calculator",
  };

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "How to Find Your Birth Card with a Calculator and Chart",
    description: DESCRIPTION,
    dateModified: REVIEWED_DATE,
    datePublished: "2026-08-07",
    mainEntityOfPage: "https://cardblueprints.com/birth-card-calculator",
    author: { "@type": "Person", name: "Cassidy Rice", url: "https://cardblueprints.com/about" },
    publisher: { "@id": "https://cardblueprints.com/#organization" },
  };

  return (
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "Birth Card Calculator", href: "/birth-card-calculator" }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />

      <header className="max-w-3xl">
        <p className="eyebrow mb-2 text-brand-bronze">Free · instant · no signup</p>
        <h1 className="display mb-2 text-3xl text-brand-ink">
          Cardology Chart & Birth Card Calculator
        </h1>
        <p className="prose-reading text-brand-ink-soft" data-ai-summary>
          Enter a birthday for the playing card — 52-card system, not tarot.
          Same date, same card. Or read the{" "}
          <a href="#cardology-chart" className="text-brand-oxblood underline underline-offset-4">full Cardology chart</a>{" "}
          for all 366 birthdays.
        </p>
      </header>

      <div className="mt-5">
        <BirthCardCalculator />
      </div>

      <p className="mt-6 max-w-2xl text-sm leading-relaxed text-brand-ink-soft">
        Optional paid step after the free card:{" "}
        <Link href="/products/one-question-reading" className="text-brand-oxblood underline underline-offset-4">
          One Question Reading — $13
        </Link>{" "}
        (one decision, read from your card, this year's cards, and the card you owe; written for you the moment you pay,
        on your screen and in your inbox within about a minute).
        The free calculator never stores your birthday.
      </p>

      <p className="mt-6 text-sm leading-relaxed text-brand-ink-soft">
        Written and reviewed by{" "}
        <Link href="/about" className="text-brand-oxblood underline underline-offset-4">
          Cassidy Rice
        </Link>{" "}
        · Updated {updatedLabel(REVIEWED_DATE)} ·{" "}
        <Link href="/editorial-policy" className="text-brand-oxblood underline underline-offset-4">
          Editorial standards
        </Link>
        . New to the method?{" "}
        <Link href="/what-is-cardology" className="text-brand-oxblood underline underline-offset-4">
          How Cardology works
        </Link>
        .
      </p>

      <aside className="mt-6 rounded-2xl border border-gold/25 bg-white/[0.03] p-4 sm:p-5" aria-label="Playing cards, not tarot">
        <p className="font-serif text-base text-brand-ink">
          <strong>Playing cards, not tarot.</strong>
        </p>
        <p className="mt-2 text-sm leading-relaxed text-brand-ink-soft">
          This tool maps your birthday to one card in a standard 52-card deck — Hearts,
          Clubs, Diamonds, Spades. It is <strong>not</strong> a tarot birth-card calculator
          (those use Major Arcana pairs from a different formula). Same birthday always
          returns the same playing card.
        </p>
        <p className="mt-3 text-sm">
          <Link href="/cardology-vs-tarot" className="text-brand-oxblood underline underline-offset-4">
            How Cardology differs from tarot →
          </Link>
        </p>
      </aside>

      <nav className="mt-5 flex flex-wrap gap-2" aria-label="Calculator guide sections">
        {[
          ["#how-it-works", "How it works"],
          ["#cardology-chart", "Cardology Chart"],
          ["#worked-example", "Worked example"],
          ["#birth-vs-ruling", "Birth vs ruling card"],
          ["#trust-and-limits", "Method & trust"],
          ["#faq", "FAQ"],
        ].map(([href, label]) => (
          <a key={href} href={href} className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-brand-ink-soft hover:text-brand-ink">
            {label}
          </a>
        ))}
      </nav>

      <section id="cardology-chart" className="mt-10 scroll-mt-10">
        <p className="eyebrow mb-2 text-brand-bronze">The birthday map</p>
        <h2 className="font-serif text-3xl text-brand-ink">Cardology Chart</h2>
        <p className="prose-reading mt-4 text-brand-ink-soft">
          A Cardology chart (also called the Cardology calendar or birthday
          chart) is the birthday-to-playing-card map: every calendar date
          resolves to one card in a standard 52-card deck. Month and day are
          coordinates in a fixed pattern language — Hearts, Clubs, Diamonds,
          Spades — not a shuffled draw, not tarot, and not fortune-telling. Same
          date always yields the same card.
        </p>
        <p className="prose-reading mt-4 text-brand-ink-soft">
          The free calculator above runs that same formula for one birthday. The
          chart below is the whole map, so you can check a friend, a parent, or a
          family at a glance. Find your month across the top and your day down
          the side; the cell is your birth card. Tap any card to open that
          birthday&rsquo;s page.
        </p>
        <BirthdayChartTable />
        <h3 className="mt-8 font-serif text-xl text-brand-ink">Card meanings</h3>
        <p className="prose-reading mt-2 text-sm text-brand-ink-soft">Found your card in the chart? Open its meaning.</p>
        <nav className="mt-3 flex flex-wrap gap-1.5" aria-label="All 52 birth card meanings">
          {allCardSeo().map((c) => (
            <Link
              key={c.slug}
              href={`/birth-card/${c.slug}`}
              title={`${c.label} birth card meaning`}
              className={`rounded-[3px] border border-white/10 px-2 py-1 font-serif text-sm transition hover:border-gold/40 ${c.glyph === "\u2665" || c.glyph === "\u2666" ? "text-brand-oxblood" : "text-brand-ink"}`}
            >
              {c.rank}{c.glyph}
            </Link>
          ))}
          <Link href="/birth-card/joker" className="rounded-[3px] border border-white/10 px-2 py-1 font-serif text-sm text-brand-ink hover:border-gold/40">Joker</Link>
        </nav>
        <h3 className="mt-8 font-serif text-xl text-brand-ink">Browse the chart by month</h3>
        <nav className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4" aria-label="Birthday directory by month">
          {MONTH_DIRECTORY.map(([label, slug]) => (
            <a
              key={slug}
              href={`/born-on/${slug}`}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-center font-serif text-sm text-brand-ink transition hover:border-gold/40"
            >
              {label}
            </a>
          ))}
        </nav>
        <p className="prose-reading mt-4 text-sm text-brand-ink-soft">
          All 366 dates with card names:{" "}
          <a href={BIRTHDAY_DIRECTORY_PATH} className="text-brand-oxblood underline underline-offset-4">
            /born-on/
          </a>
          . How the chart is built, suit by suit:{" "}
          <Link href="/52-card-astrology-explained#birthday-chart" className="text-brand-oxblood underline underline-offset-4">
            the 52-card calendar explained
          </Link>
          .
        </p>
      </section>

      <section id="how-it-works" className="mt-12 scroll-mt-10">
        <details>
          <summary className="cursor-pointer">
            <p className="eyebrow mb-2 text-brand-bronze">How the calculation works</p>
            <h2 className="font-serif text-3xl text-brand-ink">
              How to find your birth card from your birthday
            </h2>
          </summary>
        <div className="mt-4 space-y-4">
          <p className="prose-reading text-brand-ink-soft">
            Cardology maps the calendar to a standard deck: 52 cards, four suits,
            and thirteen ranks. Your month and day resolve to one lifelong birth
            card through a fixed formula. The same date always produces the same
            result, so you can repeat the calculation instead of trusting a draw or
            an intuitive guess.
          </p>
          <ol className="grid gap-3 sm:grid-cols-3">
            {[
              ["1", "Enter the birthday", "Use the full date so the calculator can also resolve the ruling-card layer."],
              ["2", "Get the fixed card", "The month and day map to one playing card in the 52-card calendar."],
              ["3", "Verify the meaning", "Open the card page, compare suit and rank, and test the interpretation against real patterns."],
            ].map(([n, title, body]) => (
              <li key={n} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <span className="eyebrow text-brand-bronze">Step {n}</span>
                <h3 className="mt-2 font-serif text-lg text-brand-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-ink-soft">{body}</p>
              </li>
            ))}
          </ol>
          <p className="prose-reading text-brand-ink-soft">
            Want the calendar view instead of typing a date? Open the{" "}
            <a href={BIRTHDAY_DIRECTORY_PATH} className="text-brand-oxblood underline underline-offset-4">
              birthday directory
            </a>{" "}
            or the{" "}
            <Link href="/52-card-astrology-explained#birthday-chart" className="text-brand-oxblood underline underline-offset-4">
              full playing-cards birthday chart
            </Link>
            . Same date, same card.
          </p>
        </div>
        </details>
      </section>

      <section id="worked-example" className="mt-10 scroll-mt-10 rounded-2xl border border-gold/20 bg-white/[0.03] p-5 sm:p-6">
        <details>
          <summary className="cursor-pointer">
            <p className="eyebrow mb-2 text-brand-bronze">Worked verification</p>
            <h2 className="font-serif text-3xl text-brand-ink">How to calculate your birth card with playing cards</h2>
          </summary>
        <p className="prose-reading mt-4 text-brand-ink-soft">
          You can check the calculator by hand, then find the matching card in an
          ordinary playing-card deck. For a valid birthday other than December 31,
          double the month number, add the day, and subtract the total from 55:
        </p>
        <p className="mt-4 text-lg font-semibold leading-relaxed text-brand-ink">
          55 − (2 × month number + day number)
        </p>
        <p className="prose-reading mt-4 text-brand-ink-soft">
          Read the result in this suit order: Hearts 1–13, Clubs 14–26,
          Diamonds 27–39, Spades 40–52. Within each suit, Ace is 1, Jack 11,
          Queen 12, and King 13. Subtract 13 for Clubs, 26 for Diamonds,
          or 39 for Spades to get the rank.
        </p>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-brand-ink-soft">
          <li>
            <strong>January 15:</strong> 55 − (2 × 1 + 15) = 38.
            Then 38 − 26 = 12: the{" "}
            <Link href="/birth-card/queen-of-diamonds" className="text-brand-oxblood underline underline-offset-4">
              Queen of Diamonds
            </Link>.
          </li>
          <li>
            <strong>February 17:</strong> 55 − (2 × 2 + 17) = 34.
            Then 34 − 26 = 8: the{" "}
            <Link href="/birth-card/8-of-diamonds" className="text-brand-oxblood underline underline-offset-4">
              Eight of Diamonds
            </Link>.
          </li>
          <li>
            <strong>January 1:</strong> 55 − (2 × 1 + 1) = 52.
            Then 52 − 39 = 13: the{" "}
            <Link href="/birth-card/king-of-spades" className="text-brand-oxblood underline underline-offset-4">
              King of Spades
            </Link>.
          </li>
        </ol>
        <p className="prose-reading mt-4 text-brand-ink-soft">
          Try your birthday, then someone else’s. This is a lookup, not a random
          draw. <strong>December 31 is the Joker exception</strong>; do not turn
          its zero into the King of Spades. February 29 gives the Nine of Clubs.
          Use a real calendar date: February 30 is not valid.
        </p>
        <p className="prose-reading mt-4 text-brand-ink-soft">
          The arithmetic checks the card, not whether its symbolic meaning fits a
          person or predicts an event. Explore the{" "}
          <Link href="/birth-card" className="text-brand-oxblood underline underline-offset-4">
            meanings of all 52 playing cards
          </Link>{" "}
          or inspect the calculation and interpretation boundary on our{" "}
          <Link href="/methodology" className="text-brand-oxblood underline underline-offset-4">
            published methodology page
          </Link>
          .
        </p>
        </details>
      </section>

      <section id="birth-vs-ruling" className="mt-10 scroll-mt-10">
        <details>
          <summary className="cursor-pointer">
            <p className="eyebrow mb-2 text-brand-bronze">Understand the result</p>
            <h2 className="font-serif text-3xl text-brand-ink">Birth card vs. planetary ruling card</h2>
          </summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="font-serif text-xl text-brand-ink">Birth card: the fixed pattern</h3>
            <p className="mt-2 text-sm leading-relaxed text-brand-ink-soft">
              Your birth card comes from month and day and remains fixed. Read its
              suit as the life domain and its rank as the recurring function or role.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="font-serif text-xl text-brand-ink">Ruling card: the expression layer</h3>
            <p className="mt-2 text-sm leading-relaxed text-brand-ink-soft">
              The ruling card adds style and tone through the planetary layer. It can
              explain why two people with the same birth card express it differently.
            </p>
          </div>
        </div>
        <p className="prose-reading mt-4 text-brand-ink-soft">
          For a deeper comparison, read the full{" "}
          <Link href="/birth-card-vs-ruling-card" className="text-brand-oxblood underline underline-offset-4">
            birth card vs. ruling card guide
          </Link>
          .
        </p>
        </details>
      </section>

      <section className="mt-10">
        <details>
          <summary className="cursor-pointer">
            <p className="eyebrow mb-2 text-brand-bronze">Playing cards, not tarot</p>
            <h2 className="font-serif text-3xl text-brand-ink">This is a playing-card birth calculator — not tarot</h2>
          </summary>
        <TableScroll className="mt-4" label="Cardology versus tarot birth cards">
          <table className="w-full min-w-[36rem] max-w-full border-collapse text-left text-sm text-brand-ink-soft">
            <caption className="sr-only">
              Cardology playing-card calculator versus tarot birth-card systems
            </caption>
            <thead>
              <tr className="border-b border-white/15 text-brand-ink">
                <th scope="col" className="p-3">Topic</th>
                <th scope="col" className="p-3">This calculator (Cardology)</th>
                <th scope="col" className="p-3">Tarot birth cards</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/10">
                <th scope="row" className="p-3 font-semibold text-brand-ink">Deck</th>
                <td className="p-3">52 playing cards</td>
                <td className="p-3">78-card tarot (usually Major Arcana pairs)</td>
              </tr>
              <tr className="border-b border-white/10">
                <th scope="row" className="p-3 font-semibold text-brand-ink">Method</th>
                <td className="p-3">Birthday → one fixed playing card</td>
                <td className="p-3">Birth-date numerology → Major Arcana</td>
              </tr>
              <tr className="border-b border-white/10">
                <th scope="row" className="p-3 font-semibold text-brand-ink">Shuffle?</th>
                <td className="p-3">No — same date, same card</td>
                <td className="p-3">Spreads usually shuffle; birth-card formulas vary</td>
              </tr>
              <tr className="border-b border-white/10">
                <th scope="row" className="p-3 font-semibold text-brand-ink">Example result</th>
                <td className="p-3">Queen of Diamonds</td>
                <td className="p-3">e.g. Death + Emperor (different system)</td>
              </tr>
              <tr>
                <th scope="row" className="p-3 font-semibold text-brand-ink">Use this if…</th>
                <td className="p-3">You want your birthday&rsquo;s <strong>playing card</strong></td>
                <td className="p-3">You want tarot Major Arcana pairs</td>
              </tr>
            </tbody>
          </table>
        </TableScroll>
        <p className="prose-reading mt-4 text-brand-ink-soft">
          Baby / stationery &ldquo;birth cards&rdquo; are also unrelated — those are printed
          announcements, not a calculation.
        </p>
        <p className="prose-reading mt-4 text-brand-ink-soft">
          Came from a tarot birth-card tool and want the playing-card system instead?
          You&rsquo;re in the right place. Full side-by-side:{" "}
          <Link href="/cardology-vs-tarot" className="text-brand-oxblood underline underline-offset-4">
            Cardology vs tarot
          </Link>
          .
        </p>
        <p className="prose-reading mt-4 text-brand-ink-soft">
          Some sites call related birthday-to-playing-card systems{" "}
          <strong>Destiny Cards</strong> or <strong>Love Cards</strong>. We use{" "}
          <strong>Cardology</strong> and publish the method so you can check the math.{" "}
          <Link href="/destiny-cards" className="text-brand-oxblood underline underline-offset-4">
            Cards of Destiny &amp; Love Cards explained →
          </Link>
        </p>
        </details>
      </section>

      <section id="trust-and-limits" className="mt-10 scroll-mt-10">
        <details>
          <summary className="cursor-pointer">
            <p className="eyebrow mb-2 text-brand-bronze">Experience, method, and trust</p>
            <h2 className="font-serif text-3xl text-brand-ink">Why you can verify this Cardology calculator</h2>
          </summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {[
            ["Repeatable calculation", "The same month and day return the same birth card. Nothing is shuffled or randomly generated."],
            ["Worked method", "The methodology page separates fixed calculation from interpretive language and includes a date example."],
            ["Named publisher", "Cassidy Rice publishes and reviews the educational material, with editorial and correction standards linked publicly."],
            ["Private input", "The calculation runs in your browser. Anonymous analytics record calculator use, not the birthday entered."],
          ].map(([title, body]) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h3 className="font-serif text-lg text-brand-ink">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-ink-soft">{body}</p>
            </div>
          ))}
        </div>
        <p className="prose-reading mt-4 text-brand-ink-soft">
          <strong>Important limit:</strong> Cardology is a pattern-recognition system
          for self-awareness and entertainment. It describes tendencies, not fate,
          and it is not medical, legal, financial, or mental-health advice. Check the
          fixed result yourself and discard interpretations that do not fit your lived
          experience.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link href="/methodology" className="text-brand-oxblood underline underline-offset-4">Methodology</Link>
          <Link href="/about" className="text-brand-oxblood underline underline-offset-4">About Cassidy Rice</Link>
          <Link href="/editorial-policy" className="text-brand-oxblood underline underline-offset-4">Editorial policy</Link>
          <Link href="/privacy-policy" className="text-brand-oxblood underline underline-offset-4">Privacy policy</Link>
        </div>
        </details>
      </section>

      <section id="faq" className="mt-10 scroll-mt-10">
        <h2 className="eyebrow mb-4 text-brand-bronze">Birth card calculator FAQ</h2>
        <div className="space-y-4">
          {faqs.map((f) => (
            <details key={f.q} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <summary className="cursor-pointer">
                <h3 className="font-serif text-lg text-brand-ink">{f.q}</h3>
              </summary>
              <p className="prose-reading mt-2 text-sm text-brand-ink-soft">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="related-playing-card-cardology">
        <h2 id="related-playing-card-cardology" className="eyebrow mb-3 text-brand-bronze">
          Related (playing-card Cardology)
        </h2>
        <ul className="prose-reading space-y-1.5 text-brand-ink-soft">
          {[
            ["What is Cardology?", "/what-is-cardology"],
            ["Cardology vs tarot", "/cardology-vs-tarot"],
            ["Cardology for beginners", "/cardology-for-beginners"],
            ["52-card astrology explained", "/52-card-astrology-explained"],
            ["Destiny Cards synonym map", "/destiny-cards"],
          ].map(([label, href]) => (
            <li key={href}>
              <Link href={href} className="text-brand-oxblood underline underline-offset-4">
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <FreeCourseCta source="birth-card-calculator" className="mt-10" />

      <div className="card-surface mt-8 rounded-2xl p-5">
        <h2 className="font-serif text-2xl text-brand-ink">Continue your Cardology birth chart</h2>
        <p className="prose-reading mt-2 text-sm text-brand-ink-soft">
          Browse the full 52-card meanings, open the playing-cards birthday chart, or compare
          two birth cards. These supporting pages help turn one calculator result
          into a verifiable learning path.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/birth-card" className="rounded-full border border-white/15 px-4 py-2 text-sm text-brand-ink-soft hover:text-brand-ink">
            Browse all 52 cards
          </Link>
          <a href={BIRTHDAY_DIRECTORY_PATH} className="rounded-full border border-white/15 px-4 py-2 text-sm text-brand-ink-soft hover:text-brand-ink">
            Playing cards birthday chart
          </a>
          <Link href="/birth-card-compatibility-calculator" className="rounded-full border border-white/15 px-4 py-2 text-sm text-brand-ink-soft hover:text-brand-ink">
            Compatibility calculator
          </Link>
          <Link href="/what-is-cardology" className="rounded-full border border-white/15 px-4 py-2 text-sm text-brand-ink-soft hover:text-brand-ink">
            What is Cardology?
          </Link>
          <Link href="/cardology-for-beginners" className="rounded-full border border-white/15 px-4 py-2 text-sm text-brand-ink-soft hover:text-brand-ink">
            Beginners guide
          </Link>
          <Link href="/destiny-cards" className="rounded-full border border-white/15 px-4 py-2 text-sm text-brand-ink-soft hover:text-brand-ink">
            Destiny Cards hub
          </Link>
          <Link href="/cardology-compatibility" className="rounded-full border border-white/15 px-4 py-2 text-sm text-brand-ink-soft hover:text-brand-ink">
            Compatibility guide
          </Link>
          <Link href="/methodology" className="rounded-full border border-white/15 px-4 py-2 text-sm text-brand-ink-soft hover:text-brand-ink">
            Methodology
          </Link>
        </div>
      </div>
    </SeoShell>
  );
}
