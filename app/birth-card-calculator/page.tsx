import type { Metadata } from "next";
import Link from "next/link";
import { FreeCourseCta } from "@/components/free-course/FreeCourseCta";
import { SeoShell } from "@/components/seo/SeoShell";
import { BirthCardCalculator } from "@/components/seo/BirthCardCalculator";
import {
  BIRTHDAY_DIRECTORY_PATH,
  COMPATIBILITY_DIRECTORY_PATH,
  SITE_NAME,
} from "@/lib/site";

const TITLE = "Birth Card Calculator (Playing Cards & Cardology)";
const DESCRIPTION =
  "Use this free Cardology birth card calculator to find the playing card linked to your birthday, plus your ruling card. Fixed 52-card method, not tarot.";
const REVIEWED_DATE = "2026-08-07";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "birth card calculator",
    "Cardology calculator",
    "playing card astrology calculator",
    "what is my birth card",
    "what card am I based on my birthday",
    "birth card calculator playing cards",
  ],
  alternates: { canonical: "/birth-card-calculator" },
  openGraph: {
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    url: "/birth-card-calculator",
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Card Blueprints" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og/default.png"],
  },
};

const faqs = [
  {
    q: "What is a birth card in Cardology?",
    a: "In Cardology, your birth card is the single playing card your birthday maps to in a fixed 52-card system. It is calculated from month and day, stays the same for life, and describes a default pattern — not a random tarot draw and not a paper birth announcement.",
  },
  {
    q: "Is this a tarot birth card calculator?",
    a: "No. Tarot birth cards use Major Arcana math from a different tradition. This calculator uses a standard 52-card playing deck (Hearts, Clubs, Diamonds, Spades) in the Cardology / playing-card astrology system. If you want tarot pairs like Death and the Emperor, use a tarot tool; if you want your birthday’s playing card, use this one.",
  },
  {
    q: "How is the birth card calculated?",
    a: "It is a deterministic formula on birth month and day. The same birthday always produces the same card — no shuffle, no interpretation step, and nothing random. You can re-run it anytime and get the same result.",
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
    q: "Which playing card represents my birthday?",
    a: "Enter the full birthday below. The calculator returns the playing card for that date plus the ruling card layer. You can also browse every date in the birthday directory.",
  },
  {
    q: "What card am I based on my birthday?",
    a: "In the Cardology system, your month and day map to one card in a standard 52-card deck. Use the calculator above for the exact result, then open the linked card meaning to study its suit, rank, balanced expression, and shadow range.",
  },
  {
    q: "Is this also called a Destiny Cards calculator?",
    a: "Destiny Cards is a related name used by some teachers and websites for birthday-to-playing-card systems. Card Blueprints calls the practice Cardology and documents its own deterministic calculation method. If two tools disagree, use the published method and repeat the same date to compare results. Came via Destiny Cards, Love Cards, or Science of the Cards? Read the full synonym map at /destiny-cards.",
  },
  {
    q: "Is the free Cardology calculator private?",
    a: "The birth-card calculation runs in your browser. The calculator tracks anonymous start and completion events for site analytics, but it does not send the birthday itself in those events.",
  },
  {
    q: "Can two people have the same birth card?",
    a: "Yes. Most cards cover several birthdays. February 29 maps normally in the cycle (9 of Clubs). December 31 is the Joker boundary, sometimes called the Day Out of Time. The ruling-card layer often differs even when the birth card matches.",
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
    name: "Cardology Birth Card Calculator",
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: [
      "Playing-card birth card from birthday",
      "Planetary ruling card",
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
    headline: "How to Find Your Birth Card with a 52-Card Calculator",
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
        <p className="eyebrow mb-3 text-gold">Free · instant · no signup</p>
        <h1 className="display mb-3 text-3xl text-bone">
          Free Birth Card Calculator for the 52-Card System
        </h1>
        <p className="prose-reading text-mist" data-ai-summary>
          Enter your birthday to find <strong>which playing card represents you</strong>
          in Cardology. The calculator returns your fixed birth card and planetary
          ruling card instantly. It uses a standard 52-card deck, not tarot Major
          Arcana and not a random draw. New to the method? Read the plain-English{" "}
          <Link href="/what-is-cardology" className="text-gold underline underline-offset-4">
            guide to how Cardology works
          </Link>
          .
        </p>
        <p className="mt-4 text-sm leading-relaxed text-faint">
          Written and reviewed by{" "}
          <Link href="/about" className="text-gold underline underline-offset-4">
            Cassidy Rice
          </Link>{" "}
          · Method reviewed August 7, 2026 ·{" "}
          <Link href="/editorial-policy" className="text-gold underline underline-offset-4">
            Editorial standards
          </Link>
        </p>
      </header>

      <div className="mt-6">
        <BirthCardCalculator />
      </div>

      <nav className="mt-5 flex flex-wrap gap-2" aria-label="Calculator guide sections">
        {[
          ["#how-it-works", "How it works"],
          ["#worked-example", "Worked example"],
          ["#birth-vs-ruling", "Birth vs ruling card"],
          ["#trust-and-limits", "Method & trust"],
          ["#faq", "FAQ"],
        ].map(([href, label]) => (
          <a key={href} href={href} className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-mist hover:text-bone">
            {label}
          </a>
        ))}
      </nav>

      <div className="card-surface mt-8 rounded-2xl border border-gold/25 p-5">
        <p className="font-serif text-base text-bone">
          Want the full pattern, not just the card?
        </p>
        <p className="mt-2 text-sm leading-relaxed text-mist">
          The Personal Card Blueprint writes out your birth card, ruling card,
          and the chapter you&rsquo;re in now — delivered instantly after
          checkout, no phone call.
        </p>
        <div className="mt-4">
          <Link
            href="/products/personal-card-blueprint"
            className="accent-button inline-flex min-h-11 items-center justify-center px-5 py-2.5 text-sm"
          >
            Get My Blueprint &mdash; $29
          </Link>
        </div>
      </div>

      <section id="how-it-works" className="mt-12 scroll-mt-10">
        <p className="eyebrow mb-2 text-gold">How the calculation works</p>
        <h2 className="font-serif text-3xl text-bone">
          How to find your birth card from your birthday
        </h2>
        <div className="mt-4 space-y-4">
          <p className="prose-reading text-mist">
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
                <span className="eyebrow text-gold">Step {n}</span>
                <h3 className="mt-2 font-serif text-lg text-bone">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mist">{body}</p>
              </li>
            ))}
          </ol>
          <p className="prose-reading text-mist">
            This is why people also search for a <strong>Cardology calculator</strong>,
            a <strong>playing-card astrology calculator</strong>, or ask,
            &ldquo;What card am I based on my birthday?&rdquo; Those phrases point to
            the same birthday-to-playing-card intent on this page. They do not mean
            a tarot birth-card pair.
          </p>
        </div>
      </section>

      <section id="worked-example" className="mt-10 scroll-mt-10 rounded-2xl border border-gold/20 bg-white/[0.03] p-5 sm:p-6">
        <p className="eyebrow mb-2 text-gold">Worked verification</p>
        <h2 className="font-serif text-3xl text-bone">Birth card calculator example: January 15</h2>
        <p className="prose-reading mt-4 text-mist">
          Enter January 15 and the calculator returns the <strong>Queen of Diamonds</strong>{" "}
          as the birth card. Run January 15 again and the answer stays the same. That
          repeatability is the simplest accuracy check: fixed input, fixed output.
          You can inspect the longer calculation and interpretation boundary on our{" "}
          <Link href="/methodology" className="text-gold underline underline-offset-4">
            published methodology page
          </Link>
          .
        </p>
      </section>

      <section id="birth-vs-ruling" className="mt-10 scroll-mt-10">
        <p className="eyebrow mb-2 text-gold">Understand the result</p>
        <h2 className="font-serif text-3xl text-bone">Birth card vs. planetary ruling card</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="font-serif text-xl text-bone">Birth card: the fixed pattern</h3>
            <p className="mt-2 text-sm leading-relaxed text-mist">
              Your birth card comes from month and day and remains fixed. Read its
              suit as the life domain and its rank as the recurring function or role.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="font-serif text-xl text-bone">Ruling card: the expression layer</h3>
            <p className="mt-2 text-sm leading-relaxed text-mist">
              The ruling card adds style and tone through the planetary layer. It can
              explain why two people with the same birth card express it differently.
            </p>
          </div>
        </div>
        <p className="prose-reading mt-4 text-mist">
          For a deeper comparison, read the full{" "}
          <Link href="/birth-card-vs-ruling-card" className="text-gold underline underline-offset-4">
            birth card vs. ruling card guide
          </Link>
          .
        </p>
      </section>

      <section className="mt-10">
        <p className="eyebrow mb-2 text-gold">Search intent, clearly separated</p>
        <h2 className="font-serif text-3xl text-bone">Playing-card birth calculator, not tarot</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse text-left text-sm text-mist">
            <thead>
              <tr className="border-b border-white/15 text-bone">
                <th className="p-3">System</th>
                <th className="p-3">Deck</th>
                <th className="p-3">Method</th>
                <th className="p-3">This tool?</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/10">
                <td className="p-3">Cardology / playing-card astrology</td>
                <td className="p-3">52 playing cards</td>
                <td className="p-3">Birthday maps to a fixed card</td>
                <td className="p-3 font-semibold text-gold">Yes</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="p-3">Tarot birth cards</td>
                <td className="p-3">Major Arcana from a 78-card tarot deck</td>
                <td className="p-3">Birth-date numerology</td>
                <td className="p-3">No</td>
              </tr>
              <tr>
                <td className="p-3">Baby or stationery birth cards</td>
                <td className="p-3">Printed announcement</td>
                <td className="p-3">Graphic design or messaging</td>
                <td className="p-3">No</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="prose-reading mt-4 text-mist">
          Some sites call related birthday-card systems <strong>Destiny Cards</strong>.
          We use Cardology and publish our calculation method so the result can be
          checked. For the broader distinction, see{" "}
          <Link href="/cardology-vs-tarot" className="text-gold underline underline-offset-4">
            Cardology vs. tarot
          </Link>
          .
        </p>
      </section>

      <section id="trust-and-limits" className="mt-10 scroll-mt-10">
        <p className="eyebrow mb-2 text-gold">Experience, method, and trust</p>
        <h2 className="font-serif text-3xl text-bone">Why you can verify this Cardology calculator</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {[
            ["Repeatable calculation", "The same month and day return the same birth card. Nothing is shuffled or randomly generated."],
            ["Worked method", "The methodology page separates fixed calculation from interpretive language and includes a date example."],
            ["Named publisher", "Cassidy Rice publishes and reviews the educational material, with editorial and correction standards linked publicly."],
            ["Private input", "The calculation runs in your browser. Anonymous analytics record calculator use, not the birthday entered."],
          ].map(([title, body]) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h3 className="font-serif text-lg text-bone">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mist">{body}</p>
            </div>
          ))}
        </div>
        <p className="prose-reading mt-4 text-mist">
          <strong>Important limit:</strong> Cardology is a pattern-recognition system
          for self-awareness and entertainment. It describes tendencies, not fate,
          and it is not medical, legal, financial, or mental-health advice. Check the
          fixed result yourself and discard interpretations that do not fit your lived
          experience.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link href="/methodology" className="text-gold underline underline-offset-4">Methodology</Link>
          <Link href="/about" className="text-gold underline underline-offset-4">About Cassidy Rice</Link>
          <Link href="/editorial-policy" className="text-gold underline underline-offset-4">Editorial policy</Link>
          <Link href="/privacy-policy" className="text-gold underline underline-offset-4">Privacy policy</Link>
        </div>
      </section>

      <section id="faq" className="mt-10 scroll-mt-10">
        <h2 className="eyebrow mb-4 text-gold">Birth card calculator FAQ</h2>
        <div className="space-y-4">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h3 className="font-serif text-lg text-bone">{f.q}</h3>
              <p className="prose-reading mt-2 text-sm text-mist">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <FreeCourseCta source="birth-card-calculator" className="mt-10" />

      <div className="card-surface mt-8 rounded-2xl p-5">
        <h2 className="font-serif text-2xl text-bone">Continue your Cardology birth chart</h2>
        <p className="prose-reading mt-2 text-sm text-mist">
          Browse the full 52-card meanings, open every birthday date, or compare
          two birth cards. These supporting pages help turn one calculator result
          into a verifiable learning path.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/birth-card" className="rounded-full border border-white/15 px-4 py-2 text-sm text-mist hover:text-bone">
            Browse all 52 cards
          </Link>
          <a href={BIRTHDAY_DIRECTORY_PATH} className="rounded-full border border-white/15 px-4 py-2 text-sm text-mist hover:text-bone">
            Birthdays by date
          </a>
          <a href={COMPATIBILITY_DIRECTORY_PATH} className="rounded-full border border-white/15 px-4 py-2 text-sm text-mist hover:text-bone">
            All card pairings
          </a>
          <Link href="/cardology-compatibility" className="rounded-full border border-white/15 px-4 py-2 text-sm text-mist hover:text-bone">
            Compatibility guide
          </Link>
          <Link href="/methodology" className="rounded-full border border-white/15 px-4 py-2 text-sm text-mist hover:text-bone">
            Methodology
          </Link>
        </div>
      </div>
    </SeoShell>
  );
}
