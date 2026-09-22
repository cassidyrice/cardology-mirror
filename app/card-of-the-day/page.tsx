import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { updatedLabel } from "@/lib/page-updated";
import { SUIT_COLOR_PAPER } from "@/lib/cards";
import { birthdateBySlug, type BirthdateSeo, type CardSeo } from "@/lib/seo-cards";

// Deploys are manual and infrequent, so "today" can never be baked in at
// build time. This page is edge-rendered per request (same pattern as
// /checkout/success) and computes the date in America/Denver on every hit.
// Cache-Control for this route is pinned to no-store in middleware.ts —
// next.config headers() never reach page responses here (the compiled
// next-on-pages middleware route carries override:true and wipes them).
export const runtime = "edge";
export const dynamic = "force-dynamic";

// Metadata is computed per request (the page is force-dynamic): the title
// names today's actual card for freshness and SERP CTR, while the OG stays
// today-agnostic on purpose — the page content rotates daily, so a
// card-specific OG image would be stale for anyone sharing yesterday.
export function generateMetadata(): Metadata {
  const now = denverToday();
  const label = labelOf(now);
  const card = birthdateBySlug(slugOf(now))?.card ?? null;
  const title = card
    ? `Card of the Day: ${card.label} — ${label}`
    : `Card of the Day: The Joker — ${label}`;
  const description = card
    ? `Today's Cardology card of the day (${label}) is the ${card.label}. Every date maps to exactly one playing card — see its meaning in love and work, free.`
    : `Today, ${label}, is the Joker's day — the one date outside the 52-card map. See how the card of the day works, free.`;
  const ogTitle = "Card of the Day: Free Daily Playing Card Reading";
  const ogDescription =
    "Every calendar date maps to exactly one of the 52 playing cards — no shuffle, no draw. See today's card and its meaning, free.";
  return {
    title,
    description,
    alternates: { canonical: "/card-of-the-day" },
    openGraph: {
      siteName: SITE_NAME,
      title: ogTitle,
      description: ogDescription,
      url: "/card-of-the-day",
      images: [{ url: "/og/card-of-the-day.png", width: 1200, height: 630, alt: "Card of the Day — three playing cards fanned on paper" }],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: ["/og/card-of-the-day.png"],
    },
  };
}

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
  const updatedIso = `${now.year}-${String(now.month).padStart(2, "0")}-${String(now.day).padStart(2, "0")}`;
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
      q: "What is the Cardology card of the day?",
      a: card
        ? `The Cardology card of the day for ${label} is the ${card.label}. Cardology maps every calendar date to exactly one playing card, so the day's card is the birth card of that date — the same card for every reader, every year.`
        : `The Cardology card of the day is the playing card a calendar date maps to — every date except one resolves to exactly one card. Today, ${label}, is the exception: December 31 belongs to the Joker, the deck's wild 53rd card.`,
    },
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
      name: "Cardology Card of the Day",
      description:
        "Free daily playing-card reading: every calendar date maps to exactly one of the 52 cards, so the card of the day is the birth card of today's date. Updates daily.",
      url: `${SITE_URL}/card-of-the-day`,
      dateModified: updatedIso,
      isPartOf: { "@id": `${SITE_URL}/#website` },
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

      <div className="mb-4 flex items-center gap-5">
        <img
          src={`/share-cards/faces/${card ? card.slug : "joker"}.png`}
          alt={card ? `${card.label} playing card — the card of the day for ${label}` : `The Joker playing card — ${label}`}
          width={1000}
          height={1500}
          loading="eager"
          decoding="async"
          className="w-24 shrink-0 rounded-xl border border-brand-line shadow-[0_6px_18px_rgba(20,17,13,0.18)]"
        />
        <div>
          <span className="eyebrow text-brand-ink-soft">{label}</span>
          <h1 className="display mb-0 mt-1 text-3xl text-brand-ink">
            Cardology Card of the Day
            <span className="block text-lg !text-brand-bronze">
              {card ? `Today: the ${card.label}${card.title ? ` — ${card.title}` : ""}` : "Today: the Joker"}
            </span>
          </h1>
          {card && (
            <span className="font-serif text-2xl" style={{ color: SUIT_COLOR_PAPER[card.suit] }}>{card.code}</span>
          )}
        </div>
      </div>
      <div className="mb-4 rounded-2xl border border-brand-line bg-brand-ivory/70 p-5" data-ai-summary>
        <p className="eyebrow mb-2 !text-brand-bronze">Direct answer</p>
        <p className="prose-reading text-brand-ink-soft">{directAnswer}</p>
      </div>
      <p className="mb-2 text-xs text-brand-ink-soft">Updated {updatedLabel(updatedIso)}</p>
      <p className="mb-6">
        <Link href="/birth-card-calculator" className="accent-button inline-block">
          Find YOUR birth card free →
        </Link>
      </p>
      <p className="prose-reading mb-6 text-brand-ink-soft">
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
            <h2 className="eyebrow mb-2 !text-brand-bronze">Today&rsquo;s card: the {card.label}</h2>
            <div className="flex flex-col gap-5 sm:flex-row">
              <img
                src={`/share-cards/faces/${card.slug}.png`}
                alt={`${card.label} playing card — the card of the day for ${label}`}
                width={1000}
                height={1500}
                loading="lazy"
                decoding="async"
                className="w-44 shrink-0 self-start rounded-2xl border border-brand-line shadow-[0_6px_18px_rgba(20,17,13,0.18)]"
              />
              <div className="prose-reading text-brand-ink-soft">
                {card.title && <p className="eyebrow mb-2 !text-brand-bronze">{card.title}</p>}
                <p>{card.coreIdentity || card.sweetSpot}</p>
                <p>
                  The {card.label} is a {suitWord(card)} card — the suit of {card.suitDomain.toLowerCase()} —
                  carrying the rank theme of {rankTheme(card.rank).toLowerCase()}. At its
                  best today, that pattern looks like this: {card.sweetSpot}
                </p>
                <p className="text-sm">
                  <Link href={`/birth-card/${card.slug}`} className="text-brand-oxblood underline underline-offset-4">
                    Read the full {card.label} meaning →
                  </Link>
                </p>
              </div>
            </div>
          </section>

          <section className="mt-8">
            <h2 className="eyebrow mb-2 !text-brand-bronze">Quick reads: love, work, shadow</h2>
            <div className="space-y-4">
              <QuickRead label="Love" facet="love" text={`In relationships, the ${card.label} tends to reveal itself through ${relationshipTheme(card)}. Notice where that pull is running the room today.`} />
              <QuickRead label="Work" facet="work" text={`At work, the ${card.label} wants roles and hours where ${workTheme(card)}. Days like this reward giving the pattern one clean outlet.`} />
              <QuickRead label="Shadow" facet="shadow" text={card.shadow || card.over} />
            </div>
            <p className="mt-4 text-sm text-brand-ink-soft">
              A mirror, not a forecast: today&rsquo;s card describes a pattern in
              play, not events on a schedule. If it clarifies nothing real,
              discard it.
            </p>
          </section>
        </>
      ) : (
        <section className="mt-8">
          <h2 className="eyebrow mb-2 !text-brand-bronze">Today belongs to the Joker</h2>
          <div className="prose-reading text-brand-ink-soft">
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
              <a href={`/born-on/${slugOf(tomorrow)}`} className="text-brand-oxblood underline underline-offset-4">
                January 1
              </a>{" "}
              opens the year with its own fixed card.
            </p>
          </div>
        </section>
      )}

      <section className="card-surface mt-10 rounded-2xl p-5">
        <p className="font-serif text-base text-brand-ink">Get YOUR card</p>
        <p className="mt-1 text-sm text-brand-ink-soft">
          Today&rsquo;s card belongs to everyone; yours was fixed the day you
          were born. Look it up free, then explore the written interpretation.
        </p>
        <div className="mt-3">
          <Link href="/birth-card-calculator" className="accent-button inline-block w-full text-center sm:w-auto">
            Find your birth card free →
          </Link>
        </div>
      </section>

      {faqs.map((f) => (
        <section className="mt-8" key={f.q}>
          <h2 className="eyebrow mb-2 !text-brand-bronze">{f.q}</h2>
          <p className="prose-reading text-brand-ink-soft">{f.a}</p>
        </section>
      ))}

      <section className="mt-8">
        <h2 className="eyebrow mb-2 !text-brand-bronze">Yesterday, today, tomorrow</h2>
        <p className="prose-reading text-brand-ink-soft">
          The card changes at midnight, Mountain Time — come back tomorrow, or
          walk the calendar yourself. Every date&rsquo;s page reads the card as a
          birthday:
        </p>
        {/* /born-on/ pages are edge-rendered by the cardology-unlock Worker,
            not this Next app — plain <a>, same as the card pages. */}
        <nav className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
          {[
            { day: yesterday, prefix: "←", note: labelOf(yesterday) },
            { day: now, prefix: "", note: `Born on ${label}?` },
            { day: tomorrow, prefix: "", note: `${labelOf(tomorrow)} →` },
          ].map(({ day, note }) => {
            const dayCard = birthdateBySlug(slugOf(day))?.card ?? null;
            return (
              <a
                key={note}
                href={`/born-on/${slugOf(day)}`}
                className="group flex flex-col items-center gap-2 rounded-2xl border border-brand-line p-3 transition"
              >
                <img
                  src={`/share-cards/faces/${dayCard ? dayCard.slug : "joker"}.png`}
                  alt={dayCard ? `${dayCard.label} playing card` : "The Joker playing card"}
                  width={1000}
                  height={1500}
                  loading="lazy"
                  decoding="async"
                  className="w-14 rounded-[5px] border border-brand-line transition-transform group-hover:-translate-y-0.5"
                />
                <span className="!text-brand-bronze underline underline-offset-4">{note}</span>
              </a>
            );
          })}
        </nav>
      </section>


      <p className="mt-6 text-sm">
        <Link href="/what-is-cardology" className="text-brand-oxblood underline underline-offset-4">What is Cardology? →</Link>
        {"  ·  "}
        <Link href="/cartomancy-vs-tarot" className="text-brand-oxblood underline underline-offset-4">Cartomancy vs tarot →</Link>
        {"  ·  "}
        <Link href="/birth-card" className="text-brand-oxblood underline underline-offset-4">All 52 card meanings →</Link>
      </p>
    </SeoShell>
  );
}

// Label colors are inline, which outranks the .paper-shell class remaps — so
// these are what actually paint on cream. The dark palette's sage/gold/ember
// read at 2.2/1.7/3.0:1 there; these pass AA (7.3 / 5.3 / 7.1) and keep the
// three facets distinguishable by hue. The tint keeps the original color.
const QUICK_READ_TONES = {
  love: { label: "#2c5740", tint: "#7fae8f" },
  work: { label: "#7e5f29", tint: "#d9b26a" },
  shadow: { label: "#8e321f", tint: "#e0654a" },
} as const;

function QuickRead({
  label,
  facet,
  text,
}: {
  label: string;
  facet: keyof typeof QUICK_READ_TONES;
  text: string;
}) {
  const { label: labelColor, tint } = QUICK_READ_TONES[facet];
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: `${tint}33`, background: `${tint}0d` }}>
      <p className="eyebrow mb-1" style={{ color: labelColor }}>{label}</p>
      <p className="prose-reading mb-0 text-brand-ink-soft">{text}</p>
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
