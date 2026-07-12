import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { ReadingBridge } from "@/components/seo/ReadingBridge";
import { READER_PHONE_DISPLAY, READER_PHONE_TEL, TRIAL_NAME, TRIAL_PATH } from "@/lib/offers";
import { SITE_URL } from "@/lib/site";
import { birthdateBySlug, type BirthdateSeo, type CardSeo } from "@/lib/seo-cards";

// Deploys are manual and infrequent, so "today" can never be baked in at
// build time. This page is edge-rendered per request (same pattern as
// /checkout/success) and computes the date in America/Denver on every hit.
// Cache-Control for this route is pinned to no-store in middleware.ts —
// next.config headers() never reach page responses here (the compiled
// next-on-pages middleware route carries override:true and wipes them).
export const runtime = "edge";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Card of the Day: Free Daily Playing Card Reading",
  description:
    "Free card of the day from the standard 52-card deck. Every calendar date maps to exactly one playing card — see today's card, its meaning in love and work, and find your own.",
  alternates: { canonical: "/card-of-the-day" },
  openGraph: {
    title: "Card of the Day: Free Daily Playing Card Reading",
    description:
      "Every calendar date maps to exactly one of the 52 playing cards — no shuffle, no draw. See today's card and its meaning, free.",
    url: "/card-of-the-day",
    // Today-agnostic on purpose: the page content rotates daily, so a
    // card-specific OG image would be stale for anyone sharing yesterday.
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "Card Blueprints" }],
  },
};

const MONTH_SLUGS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
] as const;

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

type CalendarDay = { year: number; month: number; day: number };

// Today's calendar date in America/Denver, resolved per request. The edge
// runtime clock is UTC, so the timezone conversion goes through Intl.
function denverToday(): CalendarDay {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Denver",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

// Real calendar neighbor of a date (UTC-noon arithmetic — leap years and
// month/year boundaries resolve exactly like the actual calendar year).
function shiftDay({ year, month, day }: CalendarDay, delta: number): CalendarDay {
  const d = new Date(Date.UTC(year, month - 1, day, 12));
  d.setUTCDate(d.getUTCDate() + delta);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

function slugOf(d: CalendarDay): string {
  return `${MONTH_SLUGS[d.month - 1]}-${d.day}`;
}

function labelOf(d: CalendarDay): string {
  return `${MONTH_NAMES[d.month - 1]} ${d.day}`;
}

// One-line essence for the direct-answer sentence: the card's Cardology title
// when it has a real one, otherwise a suit + rank construction. Same fallback
// test as the daily shorts script — lens fallback titles are just the card
// name in caps and add nothing.
function essence(card: CardSeo): string {
  const t = (card.title ?? "").trim();
  const generic =
    t.toUpperCase() === card.label.toUpperCase() ||
    /^(ACE|[0-9]+|JACK|QUEEN|KING)\s+OF\s+(HEARTS|CLUBS|DIAMONDS|SPADES)$/i.test(t);
  if (t && !generic) return t.replace(/^The\s/, "the ");
  return `the ${card.suitDomain.toLowerCase()} card of ${rankTheme(card.rank).toLowerCase()}`;
}

export default function CardOfTheDayPage() {
  const now = denverToday();
  const label = labelOf(now);
  // Same date→card mapping the daily shorts pipeline uses: the day's card IS
  // the birth card of the date. Null only on December 31, the Joker's day.
  const today: BirthdateSeo | null = birthdateBySlug(slugOf(now));
  const card = today?.card ?? null;

  const yesterday = shiftDay(now, -1);
  const tomorrow = shiftDay(now, 1);

  const directAnswer = card
    ? `Today, ${label}, the card of the day is the ${card.label} — ${essence(card)}. In playing-card cartomancy every calendar date maps to one of the 52 cards; today's card is the birth card of anyone born on ${label}.`
    : `Today, ${label}, is the Joker's day — the one calendar date that maps to no card in the 52. In playing-card cartomancy every other date maps to exactly one card; December 31 belongs to the deck's wild 53rd card instead.`;

  const faqs = [
    {
      q: "What is the card of the day?",
      a: card
        ? `The card of the day for ${label} is the ${card.label}. In playing-card cartomancy every calendar date maps to exactly one of the 52 cards, so the day's card is simply the birth card of that date — the ${card.label} is the card of everyone born on ${label}.`
        : `Today, ${label}, is the Joker's day — the one date in the calendar that maps to no card in the 52. Every other date maps to exactly one card, its birth card; December 31 sits outside the grid as the deck's wild card.`,
    },
    {
      q: "How is the card of the day chosen?",
      a: card
        ? `It is calculated, not drawn: a fixed Cardology formula maps each month and day to one card, so the same date returns the same card every year, for every reader. No shuffle and no randomness — ${label} maps to the ${card.label} this year, next year, and every year.`
        : `It is calculated, not drawn: a fixed Cardology formula maps each month and day to one card, so the same date returns the same card every year, for every reader. December 31 is the formula's single exception — its value falls outside the 52 cards, which is why the date belongs to the Joker.`,
    },
  ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Card of the Day",
      description:
        "Free daily playing-card reading: every calendar date maps to exactly one of the 52 cards, so the card of the day is the birth card of today's date. Updates daily.",
      url: `${SITE_URL}/card-of-the-day`,
      isPartOf: { "@id": `${SITE_URL}/#organization` },
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: ["[data-ai-summary]"],
      },
    },
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
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "Card of the Day", href: "/card-of-the-day" }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="mb-2 flex items-baseline gap-3">
        {card ? (
          <span className="font-serif text-5xl" style={{ color: card.color }}>{card.code}</span>
        ) : (
          <span className="font-serif text-5xl text-gold">🃏</span>
        )}
        <span className="eyebrow text-faint">{label}</span>
      </div>
      <h1 className="display mb-3 text-3xl text-bone">Card of the Day</h1>
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5" data-ai-summary>
        <p className="eyebrow mb-2 text-gold">Direct answer</p>
        <p className="prose-reading text-mist">{directAnswer}</p>
      </div>
      <p className="prose-reading mb-6 text-mist">
        This is a daily reading with no shuffle in it. The deck is built like a
        calendar — 52 cards for 52 weeks, 4 suits for 4 seasons — and a fixed
        Cardology formula assigns every month-and-day to exactly one card. So
        the card of the day isn&rsquo;t drawn; it&rsquo;s already on the calendar,
        the same way {card ? `the ${card.label} sits on ${label}` : `the Joker sits on ${label}`}{" "}
        every single year. Read today&rsquo;s pattern below, then find the card
        your own birthday pinned on you.
      </p>

      {card && today ? (
        <>
          <section className="mt-8">
            <h2 className="eyebrow mb-2 text-gold">Today&rsquo;s card: the {card.label}</h2>
            <div className="flex flex-col gap-5 sm:flex-row">
              <img
                src={`/pins/${card.slug}.png`}
                alt={`${card.label} — the card of the day for ${label}`}
                width={1000}
                height={1500}
                loading="eager"
                decoding="async"
                className="w-44 shrink-0 self-start rounded-2xl border border-white/10"
              />
              <div className="prose-reading text-mist">
                {card.title && <p className="eyebrow mb-2 text-gold">{card.title}</p>}
                <p>{card.coreIdentity || card.sweetSpot}</p>
                <p>
                  The {card.label} is a {suitWord(card)} card — the suit of {card.suitDomain.toLowerCase()} —
                  carrying the rank theme of {rankTheme(card.rank).toLowerCase()}. At its
                  best today, that pattern looks like this: {card.sweetSpot}
                </p>
                <p className="text-sm">
                  <Link href={`/birth-card/${card.slug}`} className="text-gold underline underline-offset-4">
                    Read the full {card.label} meaning →
                  </Link>
                </p>
              </div>
            </div>
          </section>

          <section className="mt-8">
            <h2 className="eyebrow mb-2 text-gold">Quick reads: love, work, shadow</h2>
            <div className="space-y-4">
              <QuickRead label="Love" tone="#7fae8f" text={`In relationships, the ${card.label} tends to reveal itself through ${relationshipTheme(card)}. Notice where that pull is running the room today.`} />
              <QuickRead label="Work" tone="#d9b26a" text={`At work, the ${card.label} wants roles and hours where ${workTheme(card)}. Days like this reward giving the pattern one clean outlet.`} />
              <QuickRead label="Shadow" tone="#e0654a" text={card.shadow || card.over} />
            </div>
            <p className="mt-4 text-sm text-faint">
              A mirror, not a forecast: today&rsquo;s card describes a pattern in
              play, not events on a schedule. If it clarifies nothing real,
              discard it.
            </p>
          </section>
        </>
      ) : (
        <section className="mt-8">
          <h2 className="eyebrow mb-2 text-gold">Today belongs to the Joker</h2>
          <div className="prose-reading text-mist">
            <p>
              The deck&rsquo;s calendar math is exact: the 52 card values sum to
              364, one short of the solar year, and December 31 is the day left
              over. It maps to the Joker — the wild card outside every suit and
              rank. People born today are the one birthday the formula
              can&rsquo;t pin down, traditionally read as carrying a little of
              every card in the deck.
            </p>
            <p>
              Tomorrow the grid starts over:{" "}
              <a href={`/born-on/${slugOf(tomorrow)}`} className="text-gold underline underline-offset-4">
                January 1
              </a>{" "}
              opens the year with its own fixed card.
            </p>
          </div>
        </section>
      )}

      <section className="card-surface mt-10 rounded-2xl p-5">
        <p className="font-serif text-base text-bone">Get YOUR card</p>
        <p className="mt-1 text-sm text-faint">
          Today&rsquo;s card belongs to everyone; yours was fixed the day you
          were born. Look it up free — then hear it read out loud.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Link href="/birth-card-calculator" className="inline-block rounded-full bg-foil px-5 py-2 font-serif text-sm text-ink">
            Birth Card Calculator →
          </Link>
          <a href={READER_PHONE_TEL} className="text-sm font-bold text-gold underline underline-offset-4">
            Call the AI reader free: {READER_PHONE_DISPLAY}
          </a>
        </div>
        <p className="mt-3 text-xs text-faint">
          The free call reads your first card on the spot. Want it daily? See the{" "}
          <Link href={TRIAL_PATH} className="text-gold underline underline-offset-4">{TRIAL_NAME}</Link>.
        </p>
      </section>

      {faqs.map((f) => (
        <section className="mt-8" key={f.q}>
          <h2 className="eyebrow mb-2 text-gold">{f.q}</h2>
          <p className="prose-reading text-mist">{f.a}</p>
        </section>
      ))}

      <section className="mt-8">
        <h2 className="eyebrow mb-2 text-gold">Yesterday, today, tomorrow</h2>
        <p className="prose-reading text-mist">
          The card changes at midnight, Mountain Time — come back tomorrow, or
          walk the calendar yourself. Every date&rsquo;s page reads the card as a
          birthday:
        </p>
        {/* /born-on/ pages are edge-rendered by the cardology-unlock Worker,
            not this Next app — plain <a>, same as the card pages. */}
        <nav className="mt-4 flex items-center justify-between text-sm">
          <a href={`/born-on/${slugOf(yesterday)}`} className="text-gold underline underline-offset-4">
            ← {labelOf(yesterday)}
          </a>
          {card && today ? (
            <a href={`/born-on/${today.slug}`} className="text-faint hover:text-mist">
              Born on {label}?
            </a>
          ) : (
            <span className="text-faint">{label}</span>
          )}
          <a href={`/born-on/${slugOf(tomorrow)}`} className="text-gold underline underline-offset-4">
            {labelOf(tomorrow)} →
          </a>
        </nav>
      </section>

      <ReadingBridge variant="general" className="mt-10" />

      <p className="mt-6 text-sm">
        <Link href="/what-is-cardology" className="text-gold underline underline-offset-4">What is Cardology? →</Link>
        {"  ·  "}
        <Link href="/cartomancy-vs-tarot" className="text-gold underline underline-offset-4">Cartomancy vs tarot →</Link>
        {"  ·  "}
        <Link href="/birth-card" className="text-gold underline underline-offset-4">All 52 card meanings →</Link>
      </p>
    </SeoShell>
  );
}

function QuickRead({ label, tone, text }: { label: string; tone: string; text: string }) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: `${tone}33`, background: `${tone}0d` }}>
      <p className="eyebrow mb-1" style={{ color: tone }}>{label}</p>
      <p className="prose-reading mb-0 text-mist">{text}</p>
    </div>
  );
}

// The three helpers below are the card pages' own suit/rank language
// (app/birth-card/[slug]/page.tsx) so the daily quick reads never drift from
// what the full card page says.
function suitWord(card: CardSeo): string {
  return card.suit.charAt(0).toUpperCase() + card.suit.slice(1);
}

function relationshipTheme(card: CardSeo): string {
  switch (card.suit) {
    case "hearts": return "emotional presence, affection, trust, and the need to feel genuinely connected";
    case "clubs": return "conversation, shared ideas, mental stimulation, and the stories each person believes";
    case "diamonds": return "values, generosity, security, desire, and the way love is supported in real life";
    case "spades": return "commitment, endurance, repair, boundaries, and the willingness to grow through pressure";
  }
}

function workTheme(card: CardSeo): string {
  switch (card.suit) {
    case "hearts": return "care, culture, connection, service, taste, hospitality, or human relationships matter";
    case "clubs": return "communication, teaching, strategy, writing, analysis, advising, or pattern recognition matters";
    case "diamonds": return "value, business, pricing, design, resources, money, or practical exchange matters";
    case "spades": return "craft, leadership, systems, health, operations, discipline, or deep transformation matters";
  }
}

function rankTheme(rank: string): string {
  const themes: Record<string, string> = {
    A: "initiation and pure impulse",
    "2": "partnership and exchange",
    "3": "creativity and choice",
    "4": "foundation and structure",
    "5": "freedom and change",
    "6": "responsibility and recalibration",
    "7": "faith, refinement, and inner testing",
    "8": "power, influence, and mastery",
    "9": "completion and release",
    "10": "public expression and full-cycle manifestation",
    J: "youthful mastery, experimentation, and cleverness",
    Q: "inner authority, nurturance, and magnetic intelligence",
    K: "leadership, command, and mature stewardship",
  };
  return themes[rank] ?? "card expression";
}
