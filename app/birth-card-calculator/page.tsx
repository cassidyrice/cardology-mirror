import type { Metadata } from "next";
import Link from "next/link";

import { PlayingCard } from "@/components/PlayingCard";

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
  "Free Cardology chart and birth card calculator. All 366 birthdays, one playing card each. Same date, same card. Not tarot. No shuffling.";
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
        alt: "Find your birth card: Card Blueprints calculator",
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
    a: "In Cardology, your birth card is the single playing card your birthday maps to in a fixed 52-card system. It is calculated from month and day. It stays the same for life. It describes your default pattern, the one you run when you stop paying attention. It is not a random tarot draw and not a paper birth announcement.",
  },
  {
    q: "Is this a tarot birth card calculator, or not?",
    a: "No. Tarot birth cards use Major Arcana math from a 78-card tradition. This calculator uses a standard 52-card playing deck (Hearts, Clubs, Diamonds, Spades) in the Cardology system. Want pairs like Death and the Emperor? Use a tarot tool. Want the playing card locked to your birthday? You are already here. The Cardology vs tarot page has the longer breakup story.",
  },
  {
    q: "How is the birth card calculated?",
    a: "Calculate the solar value as 55 − (2 × month + day). Values 1 to 13 map to Hearts, 14 to 26 to Clubs, 27 to 39 to Diamonds, and 40 to 52 to Spades, Ace through King in each suit. January 15 gives 38: the Queen of Diamonds. December 31 gives 0 and is the Joker exception. The birth year does not change this result. Stop trying.",
  },
  {
    q: "Is this a Cardology birthday calculator or a chart calculator?",
    a: "Yes. Same tool, two names. Enter a birthday for the Cardology birth card (playing cards, not tarot). The Cardology chart on this page is the 52-card birthday map, also called a playing-cards birthday chart. Same date, same card. Every time.",
  },
  {
    q: "Does the birth year matter?",
    a: "Not for the birth card. That comes from month and day only. The year runs the timing layers and yearly spreads, which is where it gets personal.",
  },
  {
    q: "What is the difference between a birth card and a ruling card?",
    a: "The birth card is the core pattern. The planetary ruling card is the style it comes out in, selected by your zodiac sign’s ruling planet acting on your birth card’s position. Same birth card, different signs? Usually different ruling cards. That is why your card twin acts nothing like you.",
  },
  {
    q: "Is the free Cardology calculator private?",
    a: "The birth-card calculation runs in your browser. The calculator tracks anonymous start and completion events for site analytics, but it does not send the birthday itself in those events.",
  },
  {
    q: "Can two people have the same birth card?",
    a: "Yes. Most cards cover several birthdays. You are not the only one, and neither are they. February 29 maps normally in the cycle (9 of Clubs). December 31 is the Joker boundary, sometimes called the Day Out of Time. The ruling-card layer often differs even when the birth card matches.",
  },
  {
    q: "Is this also called a Destiny Cards calculator?",
    a: "Destiny Cards is a name some teachers and websites use for birthday-to-playing-card systems. Card Blueprints calls the practice Cardology and documents its own deterministic calculation method. If two tools disagree, do not pick the one that flatters you. Use the published method and run the same date again. Came here from Destiny Cards, Love Cards, or Science of the Cards? The Destiny Cards synonym map on this site sorts out the names.",
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
    image: "https://cardblueprints.com/og/birth-card-calculator.png",
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
        <p className="type-eyebrow mb-2 !text-brand-bronze">Free · instant · no signup · no small talk</p>
        <h1 className="display mb-2 text-3xl text-brand-ink">
          Cardology Chart & Birth Card Calculator
        </h1>
        <p className="prose-reading text-brand-ink-soft" data-ai-summary>
          Your birthday maps to one playing card in a standard 52-card deck.
          Enter it. Find your card. Read what it says about you.
          Your birth card stays the same for life, so use it to look at yourself, not to guess the future.
        </p>
      </header>

      <div className="mt-5">
        <BirthCardCalculator />
      </div>

      <nav className="mt-5 flex flex-wrap gap-2" aria-label="Calculator guide sections">
        {[
          ["#use-your-card", "Try the free exercise"],
          ["#what-is-a-birth-card", "What your card is"],
          ["#how-it-works", "How it works"],
          ["#cardology-chart", "Cardology Chart"],
          ["#worked-example", "Worked example"],
          ["#birth-vs-ruling", "Birth vs ruling card"],
          ["#trust-and-limits", "Method & trust"],
          ["#faq", "FAQ"],
        ].map(([href, label]) => (
          <a key={href} href={href} className="rounded-full border border-brand-line inline-flex min-h-11 items-center px-3 py-2 text-sm text-brand-ink-soft hover:text-brand-ink">
            {label}
          </a>
        ))}
      </nav>

      <section id="use-your-card" aria-labelledby="use-your-card-heading" className="mt-8 rounded-2xl border border-brand-line bg-brand-ivory/70 p-5 sm:p-6 scroll-mt-10">
        <p className="type-eyebrow mb-2 !text-brand-bronze">Your first exercise · free</p>
        <h2 id="use-your-card-heading" className="font-serif text-2xl text-brand-ink">You found your card. Now what? Don’t just screenshot it.</h2>
        <p className="prose-reading mt-3 text-brand-ink-soft">Get a real deck of playing cards. Take five minutes. You can do this without buying anything. We checked.</p>
        <figure className="mt-5 rounded-xl border border-brand-line bg-brand-paper p-4 sm:p-5">
          <figcaption className="mb-4 text-sm font-medium text-brand-ink">An example: January 15 → Queen of Diamonds → one reflection</figcaption>
          <div className="grid items-center gap-5 text-center sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
            <div className="rounded-xl border border-brand-line bg-brand-ivory p-4"><span className="type-eyebrow block">Birthday</span><span className="mt-2 block font-serif text-3xl text-brand-ink">January 15</span><span className="mt-2 block text-xs text-brand-ink-soft">Enter it in the calculator</span></div>
            <span aria-hidden="true" className="text-2xl text-brand-bronze"><span className="sm:hidden">↓</span><span className="hidden sm:inline">→</span></span>
            <div><PlayingCard code="Q♦" size="md" surface="paper" /><p className="mt-3 text-sm font-medium text-brand-ink">Queen of Diamonds</p><p className="mt-1 text-xs text-brand-ink-soft">Dig the matching card out of your deck</p></div>
            <span aria-hidden="true" className="text-2xl text-brand-bronze"><span className="sm:hidden">↓</span><span className="hidden sm:inline">→</span></span>
            <div className="rounded-xl border border-brand-line bg-brand-ivory p-4"><span className="type-eyebrow block">Reflect</span><p className="mt-2 font-serif text-xl text-brand-ink">What do I value?</p><p className="mt-2 text-xs text-brand-ink-soft">Write one real example. Not the flattering one.</p></div>
          </div>
          <p className="mt-4 text-xs text-brand-ink-soft">This is an example birthday. Use your own result and its card meaning. Not your crush’s.</p>
        </figure>
        <ol className="mt-5 grid gap-5 sm:grid-cols-3">
          <li><h3 className="font-serif text-lg text-brand-ink">1. Find it in your deck</h3><p className="mt-2 text-sm leading-relaxed text-brand-ink-soft">Match the rank and suit from your result. Put that card face up where you have to look at it. December 31 is the Joker exception. Use a Joker if your deck has one.</p></li>
          <li><h3 className="font-serif text-lg text-brand-ink">2. Read its meaning</h3><p className="mt-2 text-sm leading-relaxed text-brand-ink-soft">Open the card meaning linked in your result. Pick one theme that made you flinch a little. That one.</p></li>
          <li><h3 className="font-serif text-lg text-brand-ink">3. Ask one question</h3><p className="mt-2 text-sm leading-relaxed text-brand-ink-soft">Where does this pattern show up in my life? Write one example and one small choice you could make instead. Leave what does not fit. Be honest about what does.</p></li>
        </ol>
        <p className="mt-5 text-sm leading-relaxed text-brand-ink-soft">Want more? Your result links to your current 52-day period and your whole year. Your free card meaning is always there. It is not going anywhere, unlike some people.</p>
      </section>

      <p className="mt-6 max-w-2xl text-sm leading-relaxed text-brand-ink-soft">Your card is a starting point. Read its meaning. Try the exercise. Or <Link href="/#readings" className="editorial-link">get a personal reading from Cass</Link>. The calculation runs in your browser; your birthday is kept in this tab to continue between tools.</p>

      <section id="what-is-a-birth-card" className="mt-8 max-w-2xl scroll-mt-10">
        <h2 className="font-serif text-2xl text-brand-ink">What is a birth card in Cardology?</h2>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          It is the one playing card your month and day lock to for life. The year
          does not change the card. Suit names the life domain. Rank names how that
          domain moves. The result is a mirror you can check, not a prediction. Mirrors are rude like that.
        </p>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          Two people born on the same date share the card. Awkward. How two cards meet is on
          the{" "}
          <Link href="/cardology-compatibility" className="text-brand-oxblood underline underline-offset-4">
            Cardology compatibility
          </Link>{" "}
          page. Why the word is not cardiology, and no, it has nothing to do with your heart rate, is on{" "}
          <Link href="/what-is-cardology" className="text-brand-oxblood underline underline-offset-4">
            what is Cardology
          </Link>
          .
        </p>
      </section>

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

      <section aria-labelledby="suit-guide-heading" className="mt-8">
        <h2 id="suit-guide-heading" className="font-serif text-2xl text-brand-ink">Four suits. Four kinds of trouble.</h2>
        <p className="mt-3 text-sm leading-relaxed text-brand-ink-soft">Look at the symbol on your card. The suit is where its meaning starts. The rank adds another layer, as if you needed one.</p>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["A♥", "Hearts", "Relationships & emotion"],
            ["A♣", "Clubs", "Mind & communication"],
            ["A♦", "Diamonds", "Values & resources"],
            ["A♠", "Spades", "Work, will & transformation"],
          ].map(([code, suit, theme]) => (
            <div key={suit} className="rounded-xl border border-brand-line bg-brand-ivory/70 p-4 text-center">
              <PlayingCard code={code} size="sm" surface="paper" />
              <h3 className="mt-3 font-serif text-lg text-brand-ink">{suit}</h3>
              <p className="mt-1 text-xs leading-relaxed text-brand-ink-soft">{theme}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm"><Link href="/52-card-astrology-explained" className="text-brand-oxblood underline underline-offset-4">Go deeper on suits and ranks →</Link></p>
      </section>

      <aside className="mt-6 rounded-2xl border border-brand-line bg-brand-ivory/70 p-4 sm:p-5" aria-label="Playing cards, not tarot">
        <p className="font-serif text-base text-brand-ink">
          <strong>Playing cards, not tarot.</strong>
        </p>
        <p className="mt-2 text-sm leading-relaxed text-brand-ink-soft">
          This tool maps your birthday to one card in a standard 52-card deck: Hearts,
          Clubs, Diamonds, Spades. It is <strong>not</strong> a tarot birth-card calculator
          (those use Major Arcana pairs from a different formula). Same birthday, same
          playing card. No matter how many times you check.
        </p>
        <p className="mt-3 text-sm">
          <Link href="/cardology-vs-tarot" className="text-brand-oxblood underline underline-offset-4">
            Why Cardology is not tarot →
          </Link>
        </p>
      </aside>

      <section id="cardology-chart" className="mt-10 scroll-mt-10">
        <p className="type-eyebrow mb-2 !text-brand-bronze">The birthday map</p>
        <h2 className="font-serif text-3xl text-brand-ink">Cardology Chart</h2>
        <p className="prose-reading mt-4 text-brand-ink-soft">
          A Cardology chart (also called the Cardology calendar or birthday
          chart) is the birthday-to-playing-card map. Each calendar date
          maps to a playing card. December 31 sits apart as the Joker.
          Month and day are coordinates in a fixed pattern language: Hearts, Clubs, Diamonds,
          Spades. It is not a shuffled draw, not tarot, and not fortune-telling. Same
          date, same card. It does not care how you feel about that.
        </p>
        <p className="prose-reading mt-4 text-brand-ink-soft">
          The free calculator above runs that formula for one birthday. The
          chart below is the whole map, so you can check a friend, a parent, or an
          entire family at a glance. We both know that is next. Find your month across
          the top and your day down the side. The cell is your birth card. Tap any card
          to open that birthday&rsquo;s page.
        </p>
        <BirthdayChartTable />
        <h3 className="mt-8 font-serif text-xl text-brand-ink">Card meanings</h3>
        <p className="prose-reading mt-2 text-sm text-brand-ink-soft">Found your card in the chart? Open its meaning. Read it twice.</p>
        <nav className="mt-3 flex flex-wrap gap-1.5" aria-label="All 52 birth card meanings">
          {allCardSeo().map((c) => (
            <Link
              key={c.slug}
              href={`/birth-card/${c.slug}`}
              title={`${c.label} birth card meaning`}
              className={`rounded-[3px] border border-brand-line px-2 py-1 font-serif text-sm transition ${c.glyph === "\u2665" || c.glyph === "\u2666" ? "text-brand-oxblood" : "text-brand-ink"}`}
            >
              {c.rank}{c.glyph}
            </Link>
          ))}
          <Link href="/birth-card/joker" className="rounded-[3px] border border-brand-line px-2 py-1 font-serif text-sm text-brand-ink ">Joker</Link>
        </nav>
        <p className="prose-reading mt-4 text-sm text-brand-ink-soft">
          The chart cell is the card. These dates open that card&rsquo;s meaning page.
          Yes, you can read other people&rsquo;s. Every card lives in the{" "}
          <Link href="/birth-card" className="text-brand-oxblood underline underline-offset-4">
            52 birth card meanings
          </Link>
          .
        </p>
        <ul className="prose-reading mt-3 space-y-1.5 text-sm text-brand-ink-soft">
          <li>February 17: <Link href="/birth-card/8-of-diamonds" className="text-brand-oxblood underline underline-offset-4">Eight of Diamonds meaning</Link></li>
          <li>January 9: <Link href="/birth-card/5-of-spades" className="text-brand-oxblood underline underline-offset-4">Five of Spades meaning</Link></li>
          <li>March 30: <Link href="/birth-card/6-of-clubs" className="text-brand-oxblood underline underline-offset-4">Six of Clubs meaning</Link></li>
          <li>January 4: <Link href="/birth-card/10-of-spades" className="text-brand-oxblood underline underline-offset-4">Ten of Spades meaning</Link></li>
          <li>October 30: <Link href="/birth-card/5-of-hearts" className="text-brand-oxblood underline underline-offset-4">Five of Hearts meaning</Link></li>
          <li>January 14: <Link href="/birth-card/king-of-diamonds" className="text-brand-oxblood underline underline-offset-4">King of Diamonds meaning</Link></li>
          <li>December 31: <Link href="/birth-card/joker" className="text-brand-oxblood underline underline-offset-4">Joker birth card</Link></li>
          <li>January 25: <Link href="/birth-card/2-of-diamonds" className="text-brand-oxblood underline underline-offset-4">Two of Diamonds meaning</Link></li>
          <li>May 31: <Link href="/birth-card/ace-of-clubs" className="text-brand-oxblood underline underline-offset-4">Ace of Clubs meaning</Link></li>
          <li>April 30: <Link href="/birth-card/4-of-clubs" className="text-brand-oxblood underline underline-offset-4">Four of Clubs meaning</Link></li>
          <li>July 29: <Link href="/birth-card/queen-of-hearts" className="text-brand-oxblood underline underline-offset-4">Queen of Hearts meaning</Link></li>
          <li>January 29: <Link href="/birth-card/jack-of-clubs" className="text-brand-oxblood underline underline-offset-4">Jack of Clubs meaning</Link></li>
          <li>January 31: <Link href="/birth-card/9-of-clubs" className="text-brand-oxblood underline underline-offset-4">Nine of Clubs meaning</Link></li>
        </ul>
        <p className="prose-reading mt-4 text-sm text-brand-ink-soft">
          Two birthdays are a separate lookup. Of course you have a second one in mind. The{" "}
          <Link href="/birth-card-compatibility-calculator" className="text-brand-oxblood underline underline-offset-4">
            birth card compatibility calculator
          </Link>{" "}
          takes both dates. The{" "}
          <a href="/compatibility/" className="text-brand-oxblood underline underline-offset-4">
            card compatibility directory
          </a>{" "}
          lists each card and each pair. Destiny Cards and Love Cards names are lined up on the{" "}
          <Link href="/destiny-cards" className="text-brand-oxblood underline underline-offset-4">
            Destiny Cards synonym map
          </Link>
          . Read{" "}
          {/* /blog/what-cardology-is-and-is-not 301s here. */}
          <Link href="/what-is-cardology" className="text-brand-oxblood underline underline-offset-4">
            what Cardology is and is not
          </Link>{" "}
          for where the practice stops.
        </p>
        <h3 className="mt-8 font-serif text-xl text-brand-ink">Browse the chart by month</h3>
        <nav className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4" aria-label="Birthday directory by month">
          {MONTH_DIRECTORY.map(([label, slug]) => (
            <a
              key={slug}
              href={`/born-on/${slug}`}
              className="rounded-xl border border-brand-line bg-brand-ivory/70 px-3 py-2 text-center font-serif text-sm text-brand-ink transition "
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
            <p className="type-eyebrow mb-2 !text-brand-bronze">How the calculation works</p>
            <h2 className="font-serif text-3xl text-brand-ink">
              How to find your birth card from your birthday
            </h2>
          </summary>
        <div className="mt-4 space-y-4">
          <p className="prose-reading text-brand-ink-soft">
            Cardology maps the calendar to a standard deck: 52 cards, four suits,
            thirteen ranks. Your month and day resolve to one lifelong birth
            card through a fixed formula. Same date, same result. Run it again.
            Run it ten times. You do not have to trust a draw or somebody&rsquo;s
            gut feeling.
          </p>
          <ol className="grid gap-3 sm:grid-cols-3">
            {[
              ["1", "Enter the birthday", "Use the full date, so the calculator can also work out the ruling-card layer."],
              ["2", "Get the fixed card", "Month and day map to one playing card in the 52-card calendar. No rerolls."],
              ["3", "Verify the meaning", "Open the card page. Compare suit and rank. Test the meaning against how you actually behave, not your ideal self."],
            ].map(([n, title, body]) => (
              <li key={n} className="rounded-2xl border border-brand-line bg-brand-ivory/70 p-4">
                <span className="type-eyebrow !text-brand-bronze">Step {n}</span>
                <h3 className="mt-2 font-serif text-lg text-brand-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-ink-soft">{body}</p>
              </li>
            ))}
          </ol>
          <p className="prose-reading text-brand-ink-soft">
            Rather scroll a calendar than type a date? Open the{" "}
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

      <section id="worked-example" className="mt-10 scroll-mt-10 rounded-2xl border border-brand-line bg-brand-ivory/70 p-5 sm:p-6">
        <details>
          <summary className="cursor-pointer">
            <p className="type-eyebrow mb-2 !text-brand-bronze">Worked verification</p>
            <h2 className="font-serif text-3xl text-brand-ink">How to calculate your birth card with playing cards</h2>
          </summary>
        <p className="prose-reading mt-4 text-brand-ink-soft">
          Do not take our word for it. Check the calculator by hand, then find the
          matching card in an ordinary playing-card deck. For any valid birthday except
          December 31, double the month number, add the day, and subtract the total from 55:
        </p>
        <p className="mt-4 text-lg font-semibold leading-relaxed text-brand-ink">
          55 − (2 × month number + day number)
        </p>
        <p className="prose-reading mt-4 text-brand-ink-soft">
          Read the result in this suit order: Hearts 1 to 13, Clubs 14 to 26,
          Diamonds 27 to 39, Spades 40 to 52. Within each suit, Ace is 1, Jack 11,
          Queen 12, and King 13. Subtract 13 for Clubs, 26 for Diamonds,
          or 39 for Spades to get the rank. That is the whole secret.
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
          Try your birthday. Then someone else’s. We both know whose. This is a lookup,
          not a random draw. <strong>December 31 is the Joker exception</strong>. Do not
          turn its zero into the King of Spades. February 29 gives the Nine of Clubs.
          Use a real calendar date: February 30 is not valid.
        </p>
        <p className="prose-reading mt-4 text-brand-ink-soft">
          The arithmetic checks the card. It does not check whether the meaning fits
          you, and it does not see events coming. Read the{" "}
          <Link href="/birth-card" className="text-brand-oxblood underline underline-offset-4">
            meanings of all 52 playing cards
          </Link>{" "}
          or see where calculation ends and interpretation starts on our{" "}
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
            <p className="type-eyebrow mb-2 !text-brand-bronze">Understand the result</p>
            <h2 className="font-serif text-3xl text-brand-ink">Birth card vs. planetary ruling card</h2>
          </summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-brand-line bg-brand-ivory/70 p-5">
            <h3 className="font-serif text-xl text-brand-ink">Birth card: the fixed pattern</h3>
            <p className="mt-2 text-sm leading-relaxed text-brand-ink-soft">
              Your birth card comes from month and day. It does not move. Read its
              suit as the life domain and its rank as the role you keep playing.
            </p>
          </div>
          <div className="rounded-2xl border border-brand-line bg-brand-ivory/70 p-5">
            <h3 className="font-serif text-xl text-brand-ink">Ruling card: the expression layer</h3>
            <p className="mt-2 text-sm leading-relaxed text-brand-ink-soft">
              The ruling card adds style and tone through the planetary layer. It can
              explain why two people with the same birth card act nothing alike.
            </p>
          </div>
        </div>
        <p className="prose-reading mt-4 text-brand-ink-soft">
          Want the long version? Read the full{" "}
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
            <p className="type-eyebrow mb-2 !text-brand-bronze">Playing cards, not tarot</p>
            <h2 className="font-serif text-3xl text-brand-ink">This is a playing-card birth calculator, not tarot</h2>
          </summary>
        <TableScroll className="mt-4" label="Cardology versus tarot birth cards">
          <table className="w-full min-w-[36rem] max-w-full border-collapse text-left text-sm text-brand-ink-soft">
            <caption className="sr-only">
              Cardology playing-card calculator versus tarot birth-card systems
            </caption>
            <thead>
              <tr className="border-b border-brand-line text-brand-ink">
                <th scope="col" className="p-3">Topic</th>
                <th scope="col" className="p-3">This calculator (Cardology)</th>
                <th scope="col" className="p-3">Tarot birth cards (not this one)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-brand-line">
                <th scope="row" className="p-3 font-semibold text-brand-ink">Deck</th>
                <td className="p-3">52 playing cards</td>
                <td className="p-3">78-card tarot, not playing cards (usually Major Arcana pairs)</td>
              </tr>
              <tr className="border-b border-brand-line">
                <th scope="row" className="p-3 font-semibold text-brand-ink">Method</th>
                <td className="p-3">Birthday → one fixed playing card</td>
                <td className="p-3">Birth-date numerology → Major Arcana</td>
              </tr>
              <tr className="border-b border-brand-line">
                <th scope="row" className="p-3 font-semibold text-brand-ink">Shuffle?</th>
                <td className="p-3">No. Same date, same card</td>
                <td className="p-3">Spreads usually shuffle; birth-card formulas vary</td>
              </tr>
              <tr className="border-b border-brand-line">
                <th scope="row" className="p-3 font-semibold text-brand-ink">Example result</th>
                <td className="p-3">Queen of Diamonds</td>
                <td className="p-3">e.g. Death + Emperor (different system)</td>
              </tr>
              <tr>
                <th scope="row" className="p-3 font-semibold text-brand-ink">Use this if…</th>
                <td className="p-3">You want your birthday&rsquo;s <strong>playing card</strong></td>
                <td className="p-3">You want tarot Major Arcana pairs, not playing cards</td>
              </tr>
            </tbody>
          </table>
        </TableScroll>
        <p className="prose-reading mt-4 text-brand-ink-soft">
          Baby and stationery &ldquo;birth cards&rdquo; are also unrelated. Those are printed
          announcements, not math.
        </p>
        <p className="prose-reading mt-4 text-brand-ink-soft">
          Came from a tarot birth-card tool? This is not that, and you&rsquo;re in the
          right place anyway. Full side-by-side:{" "}
          <Link href="/cardology-vs-tarot" className="text-brand-oxblood underline underline-offset-4">
            Cardology vs tarot
          </Link>
          .
        </p>
        <p className="prose-reading mt-4 text-brand-ink-soft">
          Some sites call related birthday-to-playing-card systems{" "}
          <strong>Destiny Cards</strong> or <strong>Love Cards</strong>. We use{" "}
          <strong>Cardology</strong> and publish the method so you can check the math
          instead of trusting a vibe.{" "}
          <Link href="/destiny-cards" className="text-brand-oxblood underline underline-offset-4">
            Cards of Destiny &amp; Love Cards explained →
          </Link>
        </p>
        </details>
      </section>

      <section id="trust-and-limits" className="mt-10 scroll-mt-10">
        <details>
          <summary className="cursor-pointer">
            <p className="type-eyebrow mb-2 !text-brand-bronze">Experience, method, and trust</p>
            <h2 className="font-serif text-3xl text-brand-ink">Why you can verify this Cardology calculator</h2>
          </summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {[
            ["Repeatable calculation", "Same month and day, same birth card. Nothing is shuffled. Nothing is random. Sorry."],
            ["Worked method", "The methodology page separates the fixed math from the interpretive language. It includes a worked date example."],
            ["Named publisher", "Cassidy Rice publishes and reviews the educational material. Editorial and correction standards are public. Someone is accountable here."],
            ["Private input", "The calculation runs in your browser. Anonymous analytics record calculator use, not the birthday entered."],
          ].map(([title, body]) => (
            <div key={title} className="rounded-2xl border border-brand-line bg-brand-ivory/70 p-5">
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
        <h2 className="type-eyebrow mb-4 !text-brand-bronze">Birth card calculator FAQ</h2>
        <div className="space-y-4">
          {faqs.map((f) => (
            <details key={f.q} className="rounded-2xl border border-brand-line bg-brand-ivory/70 p-4">
              <summary className="cursor-pointer">
                <h3 className="font-serif text-lg text-brand-ink">{f.q}</h3>
              </summary>
              <p className="prose-reading mt-2 text-sm text-brand-ink-soft">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="related-playing-card-cardology">
        <h2 id="related-playing-card-cardology" className="type-eyebrow mb-3 !text-brand-bronze">
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

      <div className="card-surface mt-8 rounded-2xl p-5">
        <h2 className="font-serif text-2xl text-brand-ink">Continue your Cardology birth chart</h2>
        <p className="prose-reading mt-2 text-sm text-brand-ink-soft">
          Browse the full 52-card meanings. Open the playing-cards birthday chart. Compare
          two birth cards. One calculator result turns into something you can check,
          instead of something you just screenshot.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/birth-card" className="rounded-full border border-brand-line px-4 py-2 text-sm text-brand-ink-soft hover:text-brand-ink">
            Browse all 52 cards
          </Link>
          <a href={BIRTHDAY_DIRECTORY_PATH} className="rounded-full border border-brand-line px-4 py-2 text-sm text-brand-ink-soft hover:text-brand-ink">
            Playing cards birthday chart
          </a>
          <Link href="/birth-card-compatibility-calculator" className="rounded-full border border-brand-line px-4 py-2 text-sm text-brand-ink-soft hover:text-brand-ink">
            Compatibility calculator
          </Link>
          <Link href="/what-is-cardology" className="rounded-full border border-brand-line px-4 py-2 text-sm text-brand-ink-soft hover:text-brand-ink">
            What is Cardology?
          </Link>
          <Link href="/cardology-for-beginners" className="rounded-full border border-brand-line px-4 py-2 text-sm text-brand-ink-soft hover:text-brand-ink">
            Beginners guide
          </Link>
          <Link href="/destiny-cards" className="rounded-full border border-brand-line px-4 py-2 text-sm text-brand-ink-soft hover:text-brand-ink">
            Destiny Cards hub
          </Link>
          <Link href="/cardology-compatibility" className="rounded-full border border-brand-line px-4 py-2 text-sm text-brand-ink-soft hover:text-brand-ink">
            Compatibility guide
          </Link>
          <Link href="/methodology" className="rounded-full border border-brand-line px-4 py-2 text-sm text-brand-ink-soft hover:text-brand-ink">
            Methodology
          </Link>
        </div>
      </div>
    </SeoShell>
  );
}
