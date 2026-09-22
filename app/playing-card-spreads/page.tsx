import type { Metadata } from "next";
import Link from "next/link";

import { SeoShell } from "@/components/seo/SeoShell";
import { SeoHeroFan } from "@/components/seo/SeoHeroFan";
import { TableScroll } from "@/components/seo/TableScroll";
import cardology from "@/lib/engine-core/engine.js";
import { parseCard, SUIT_COLOR_PAPER } from "@/lib/cards";
import { SPREADS, SPREADS_HUB_PATH } from "@/lib/spreads";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const TITLE = "Playing Card Spreads: The Two Fixed Boards & 90 Yearly Spreads";
const DESCRIPTION =
  "Cardology spreads are a playing board, not a shuffle: the Life Spread, the Spirit Spread, and the 90 yearly spreads — how your card moves through them, with a real worked example.";
const OG_IMAGE = { url: "/og/playing-card-spreads.png", width: 1200, height: 630, alt: "The playing board — fanned playing cards on paper" };

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: SPREADS_HUB_PATH },
  openGraph: {
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    url: SPREADS_HUB_PATH,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

// The example everything below walks through: born February 17 → the 8♦,
// age 35 on 2026-09-01. Every value verified against lib/engine-core
// (getReading("1991-02-17", "2026-09-01")). If the engine changes, these
// go stale — scripts/cardology-system.test.ts pins the underlying walks.
const EXAMPLE = {
  birthdayLabel: "February 17",
  card: "8♦",
  age: 35,
  walkBoard: 36,
  yearPeriods: [
    { planet: "Mercury", glyph: "☿", card: "7♦", filter: "mind, communication, perception" },
    { planet: "Venus", glyph: "♀", card: "8♠", filter: "relationships, values, love" },
    { planet: "Mars", glyph: "♂", card: "10♥", filter: "action, drive, assertion" },
    { planet: "Jupiter", glyph: "♃", card: "2♠", filter: "expansion, growth, opportunity", active: true },
    { planet: "Saturn", glyph: "♄", card: "J♠", filter: "structure, limits, discipline" },
    { planet: "Uranus", glyph: "♅", card: "J♣", filter: "disruption, innovation, sudden change" },
    { planet: "Neptune", glyph: "♆", card: "5♥", filter: "dissolution, dreams, surrender" },
  ],
  longRange: "Q♠",
  pluto: "3♦",
  result: "K♦",
  environment: "7♣",
  displacement: "Q♠",
  zodiac: "Aquarius",
  zodiacGlyph: "♒",
  rulingPlanet: "Uranus",
  rulingPlanetGlyph: "♅",
  prc: "5♣",
};

const ZODIAC_TABLE = [
  { glyph: "♈", sign: "Aries", dates: "Mar 21 – Apr 19", planet: "Mars ♂" },
  { glyph: "♉", sign: "Taurus", dates: "Apr 20 – May 20", planet: "Venus ♀" },
  { glyph: "♊", sign: "Gemini", dates: "May 21 – Jun 20", planet: "Mercury ☿" },
  { glyph: "♋", sign: "Cancer", dates: "Jun 21 – Jul 22", planet: "the Moon ☽" },
  { glyph: "♌", sign: "Leo", dates: "Jul 23 – Aug 22", planet: "the Sun ☉" },
  { glyph: "♍", sign: "Virgo", dates: "Aug 23 – Sep 22", planet: "Mercury ☿" },
  { glyph: "♎", sign: "Libra", dates: "Sep 23 – Oct 22", planet: "Venus ♀" },
  { glyph: "♏", sign: "Scorpio", dates: "Oct 23 – Nov 21", planet: "Pluto ♇ (with Mars ♂)" },
  { glyph: "♐", sign: "Sagittarius", dates: "Nov 22 – Dec 21", planet: "Jupiter ♃" },
  { glyph: "♑", sign: "Capricorn", dates: "Dec 22 – Jan 19", planet: "Saturn ♄" },
  { glyph: "♒", sign: "Aquarius", dates: "Jan 20 – Feb 18", planet: "Uranus ♅" },
  { glyph: "♓", sign: "Pisces", dates: "Feb 19 – Mar 20", planet: "Neptune ♆" },
];

const PLANET_FILTERS = [
  { glyph: "☿", planet: "Mercury", filter: "The thinking filter: how the card talks, learns, and connects ideas." },
  { glyph: "♀", planet: "Venus", filter: "The wanting filter: what the card loves, values, and attracts." },
  { glyph: "♂", planet: "Mars", filter: "The doing filter: how the card pushes, fights, and gets things started." },
  { glyph: "♃", planet: "Jupiter", filter: "The growing filter: where things open up, expand, and get lucky." },
  { glyph: "♄", planet: "Saturn", filter: "The testing filter: where life applies pressure until the lesson sticks." },
  { glyph: "♅", planet: "Uranus", filter: "The surprise filter: where life swerves, breaks routine, and innovates." },
  { glyph: "♆", planet: "Neptune", filter: "The dreaming filter: what the card imagines, longs for, and dissolves into." },
  { glyph: "♇", planet: "Pluto", filter: "The pressure card of a year: the one deep challenge the year keeps returning to." },
  { glyph: "✦", planet: "Result", filter: "Where the Pluto pressure resolves: the payoff seat at the end of the year's walk." },
];

type Spread = { grid: string[][]; crown: string[] };
const ENGINE_SPREADS = (cardology as unknown as { SPREADS: Record<string, Spread> }).SPREADS;

function CardCell({ code, highlight }: { code: string; highlight?: boolean }) {
  const suit = parseCard(code)?.suit;
  return (
    <td
      className={`border border-white/10 px-1 py-1.5 text-center font-mono text-[0.72rem] sm:text-sm ${
        highlight ? "bg-brand-oxblood font-bold" : ""
      }`}
      style={{ color: highlight ? "#fff" : suit ? SUIT_COLOR_PAPER[suit] : undefined }}
    >
      {code}
    </td>
  );
}

function BoardGrid({ spread, highlight, label }: { spread: Spread; highlight: string; label: string }) {
  return (
    <TableScroll label={label}>
      <div>
        <p className="mb-1 text-center font-mono text-xs tracking-[0.2em] text-brand-ink-soft">
          crown:{" "}
          {spread.crown.map((c, i) => (
            <span
              key={c}
              className={c === highlight ? "rounded bg-brand-oxblood px-1.5 py-0.5 font-bold text-white" : ""}
              style={{ color: c === highlight ? undefined : SUIT_COLOR_PAPER[parseCard(c)?.suit ?? "spades"] }}
            >
              {c}
              {i < spread.crown.length - 1 ? " · " : ""}
            </span>
          ))}
        </p>
        <table className="w-full min-w-[20rem] border-collapse">
          <tbody>
            {spread.grid.map((row, i) => (
              <tr key={i}>
                {row.map((code) => (
                  <CardCell key={code} code={code} highlight={code === highlight} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TableScroll>
  );
}

// All 90 boards, rendered from engine data (cardology.SPREADS). Nothing here
// is authored: board N is the same structure the reading engine reads when it
// resolves a person's year (year-blueprint.ts: karma spread = age mod 90).
//
// These use a compact renderer, not BoardGrid. BoardGrid's per-cell Tailwind
// classes + inline style cost ~200 bytes a cell; at 90 boards x 52 cards that
// built a 1.7MB page. The classes below are emitted once, which keeps the
// same markup near ~25 bytes a cell. Collapsed <details> stays indexable.
const BOARD_CSS = `
.sb-w{overflow-x:auto}
.sb{border-collapse:collapse;width:100%;min-width:19rem;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.72rem}
.sb td{border:1px solid rgba(255,255,255,.1);padding:5px 2px;text-align:center;color:#cfd0dc}
.sb td.r{color:#d05c72}
.sb td.h{background:var(--oxblood);color:#fff;font-weight:700}
.sb-c{margin:0 0 5px;text-align:center;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.7rem;letter-spacing:.18em;color:#a7a698}
.sb-c .h{background:var(--oxblood);color:#fff;font-weight:700;border-radius:3px;padding:1px 5px}
`;

const RED_SUIT = /[\u2665\u2666]/; // hearts, diamonds

function CompactBoard({ spread, highlight, caption }: { spread: Spread; highlight: string; caption: string }) {
  return (
    <div className="sb-w">
      <p className="sb-c">
        crown:{" "}
        {spread.crown.map((c, i) => (
          <span key={c} className={c === highlight ? "h" : undefined}>
            {c}
            {i < spread.crown.length - 1 ? " \u00b7 " : ""}
          </span>
        ))}
      </p>
      <table className="sb">
        <caption className="sr-only">{caption}</caption>
        <tbody>
          {spread.grid.map((row, i) => (
            <tr key={i}>
              {row.map((code) => (
                <td key={code} className={code === highlight ? "h" : RED_SUIT.test(code) ? "r" : undefined}>
                  {code}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AllYearlySpreads({ highlight }: { highlight: string }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: BOARD_CSS }} />
      <div className="mt-6 space-y-1.5">
        {Array.from({ length: 90 }, (_, n) => {
          const spread = ENGINE_SPREADS[String(n)];
          if (!spread) return null;
          const alias = n === 0 ? " \u00b7 the Life Spread" : n === 1 ? " \u00b7 the Spirit Spread" : "";
          return (
            <details key={n} className="rounded-xl border border-white/10 bg-white/[0.03]">
              <summary className="cursor-pointer px-4 py-2.5 font-serif text-sm text-brand-ink">
                Spread {n}
                <span className="text-brand-ink-soft"> \u2014 the board at age {n}{alias}</span>
              </summary>
              <div className="px-3 pb-4">
                <CompactBoard spread={spread} highlight={highlight} caption={`Spread ${n}, the board at age ${n}: seven rows of seven seats plus a three-card crown.`} />
              </div>
            </details>
          );
        })}
      </div>
    </>
  );
}

export default function PlayingCardSpreads() {
  const faqs = [
    {
      q: "What are the playing card spreads in Cardology?",
      a: "Three things, and none of them involve shuffling: the Life Spread (all 52 cards in their fixed calendar seats), the Spirit Spread (the deck's second fixed arrangement), and the 90 yearly spreads (one numbered re-deal of the board for every year of life, age 0 through 90). Your birthday decides your card; the boards decide where that card sits and moves.",
    },
    {
      q: "How do the cards move through the spreads?",
      a: "Every birthday the board re-deals to the next numbered spread, and your birth card lands in a new seat. Reading forward from that seat gives the seven ~52-day period cards of your year (Mercury through Neptune), and the two seats after them give the year's Pluto and Result cards. The Long Range card comes from your seven-year cycle, and Environment/Displacement come from seat trades between boards.",
    },
    {
      q: "What is a planetary ruling card?",
      a: "Your birthday's astrology sign has a ruling planet — Aquarius answers to Uranus, Taurus to Venus, and so on. Find that planet's seat in your birth card's own walk and the card sitting there is your planetary ruling card: the style layer on top of your birth card. Cancer (the Moon), Leo (the Sun), and Scorpio (Mars and Pluto) get special handling, and some birthdays carry two ruling cards.",
    },
    {
      q: "Can I still do a three-card or yes-or-no reading with playing cards?",
      a: "You can deal any layout from any deck, but that isn't what this system is. Cardology never shuffles: the same birthday always produces the same card, the same boards, and the same yearly walk. The structure is the reading.",
    },
  ];

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const collectionPage = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Playing Card Spreads",
    description: metadata.description,
    url: `${SITE_URL}${SPREADS_HUB_PATH}`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: SPREADS.length,
      itemListElement: SPREADS.map((spread, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: spread.name,
        url: `${SITE_URL}${spread.path}`,
      })),
    },
  };

  const ex = EXAMPLE;

  return (
    <SeoShell crumb={[{ label: "Home", href: "/" }, { label: "Playing Card Spreads", href: SPREADS_HUB_PATH }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPage) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />

      <SeoHeroFan className="mb-5" />
      <p className="eyebrow mb-3 text-gold">The playing board · no shuffle</p>
      <h1 className="display mb-3 text-3xl text-brand-ink">Playing Card Spreads: The Playing Board</h1>
      <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5" data-ai-summary>
        <p className="eyebrow mb-2 text-gold">Direct answer</p>
        <p className="prose-reading text-brand-ink-soft">
          Think of a board game. The deck has two fixed boards — the{" "}
          <strong>Life Spread</strong> and the <strong>Spirit Spread</strong> —
          and 90 numbered yearly boards that re-deal every birthday. Your
          birthday gives you one card; the boards decide where that card sits,
          what supports it, what tests it, and which seven cards run your year.
          Nothing is shuffled. Ever.
        </p>
      </div>
      <p className="mb-6">
        <Link href="/birth-card-calculator" className="accent-button inline-block">
          Find your card on the board — free →
        </Link>
      </p>
      <p className="prose-reading mb-6 text-brand-ink-soft">
        New to the system? Start with{" "}
        <Link href="/what-is-cardology" className="text-gold underline underline-offset-4">
          what Cardology is
        </Link>{" "}
        — birthday to card, and what the card is for — then come back to the board.
      </p>

      <nav className="mb-8 flex flex-wrap gap-2" aria-label="The three boards">
        {SPREADS.map((s) => (
          <Link key={s.slug} href={s.path} className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-brand-ink-soft hover:text-brand-ink">
            {s.name}
          </Link>
        ))}
      </nav>

      <div className="grid gap-4 sm:grid-cols-3">
        {SPREADS.map((s) => (
          <Link key={s.slug} href={s.path} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-gold/40">
            <p className="font-serif text-lg text-brand-ink">{s.name}</p>
            <p className="mt-1 text-xs text-brand-ink-soft">{s.positions}</p>
            <p className="prose-reading mt-2 text-sm text-brand-ink-soft">{s.oneLine}</p>
          </Link>
        ))}
      </div>

      <section id="life-spread" className="mt-12 scroll-mt-10">
        <h2 className="font-serif text-3xl text-brand-ink">The Life Spread — the board at rest</h2>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          Lay all 52 cards out in calendar order and you get the Life Spread:
          seven rows of seven seats, plus three raised seats on top called the{" "}
          <strong>crown</strong>. Every card owns exactly one seat here, forever.
          It works like the starting position in chess — before anything moves,
          every piece has a home square. The {ex.card} lives in row 5, on the
          Uranus seat. That seat never changes.
        </p>
        <div className="mt-5">
          <BoardGrid spread={ENGINE_SPREADS["0"]} highlight={ex.card} label="The Life Spread" />
        </div>
        <p className="mt-2 text-xs text-brand-ink-soft">
          The Life Spread, with the {ex.card}&rsquo;s fixed seat marked. The
          seven columns carry the planet seats, Mercury → Neptune reading right
          to left — which is what puts the {ex.card} on the Uranus seat.
        </p>
      </section>

      <section id="spirit-spread" className="mt-12 scroll-mt-10">
        <h2 className="font-serif text-3xl text-brand-ink">The Spirit Spread — the second board</h2>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          The deck has one more fixed arrangement: the Spirit Spread. Same 49
          seats, same crown — different tenants. Between the two boards, cards
          trade seats, and those trades are not decoration:
        </p>
        <ul className="prose-reading mt-3 space-y-2 text-brand-ink-soft">
          <li>
            <strong className="text-brand-ink">The stretch:</strong> the card whose seat
            yours takes. That energy presses exactly where your card grips too
            hard — the pressure is the curriculum.
          </li>
          <li>
            <strong className="text-brand-ink">The steady:</strong> the card that takes
            your seat. That energy shows up as support when you need it.
          </li>
          <li>
            <strong className="text-brand-ink">Environment &amp; Displacement:</strong>{" "}
            the same trade read for a lifetime. For the {ex.card}: Environment{" "}
            <strong>{ex.environment}</strong> (the energy that carries you) and
            Displacement <strong>{ex.displacement}</strong> (the seat your card
            pushes out of place).
          </li>
        </ul>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          On this board the {ex.card} sits on the crown — one of the raised
          seats above the grid.
        </p>
        <div className="mt-5">
          <BoardGrid spread={ENGINE_SPREADS["1"]} highlight={ex.card} label="The Spirit Spread" />
        </div>
      </section>

      <section id="yearly-spreads" className="mt-12 scroll-mt-10">
        <h2 className="font-serif text-3xl text-brand-ink">The 90 Yearly Spreads — the board re-deals</h2>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          Here is the moving part. Every birthday, the whole board re-deals into
          the next numbered arrangement — spread 0, spread 1, spread 2, all the
          way to spread 90, one for every year of life. Your card gets picked up
          and set down on a new seat. Two copies of the board matter each year:
        </p>
        <ul className="prose-reading mt-3 space-y-2 text-brand-ink-soft">
          <li>
            <strong className="text-brand-ink">Where you stand:</strong> the board
            numbered with your age. Turned {ex.age}? Open spread {ex.age} and
            find your card — that seat is your position this year.
          </li>
          <li>
            <strong className="text-brand-ink">Where you walk:</strong> the next board
            (number {ex.walkBoard}). Reading forward from your card&rsquo;s seat
            gives the seven cards your year moves through — one for each planet,
            about 52 days each, starting on your birthday.
          </li>
        </ul>

        <h3 className="mt-8 font-serif text-2xl text-brand-ink">
          Worked example: the {ex.card}, born {ex.birthdayLabel}, age {ex.age}
        </h3>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          The seven 52-day cards of this {ex.card} year, in walking order. Each
          planet is a filter: the same person, the same year — but each ~52-day
          stretch runs through a different lens.
        </p>
        <TableScroll label="The seven 52-day period cards" className="mt-4">
          <table className="w-full min-w-[24rem] border-collapse text-sm">
            <thead>
              <tr>
                <th className="border-b-2 border-gold px-2 py-2 text-left text-xs uppercase tracking-[0.14em] text-gold">Period</th>
                <th className="border-b-2 border-gold px-2 py-2 text-left text-xs uppercase tracking-[0.14em] text-gold">Card</th>
                <th className="border-b-2 border-gold px-2 py-2 text-left text-xs uppercase tracking-[0.14em] text-gold">The filter</th>
              </tr>
            </thead>
            <tbody>
              {ex.yearPeriods.map((p) => (
                <tr key={p.planet} className={p.active ? "bg-white/[0.06]" : ""}>
                  <td className="border-b border-white/10 px-2 py-2 text-brand-ink-soft">
                    <span aria-hidden="true" className="mr-1.5">{p.glyph}</span>
                    {p.planet}
                    {p.active && (
                      <span className="ml-2 rounded bg-brand-oxblood px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-white">now</span>
                    )}
                  </td>
                  <td className="border-b border-white/10 px-2 py-2 font-mono" style={{ color: SUIT_COLOR_PAPER[parseCard(p.card)?.suit ?? "spades"] }}>
                    {p.card}
                  </td>
                  <td className="border-b border-white/10 px-2 py-2 text-brand-ink-soft">{p.filter}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
        <p className="prose-reading mt-4 text-brand-ink-soft">
          Walk two more seats past Neptune and the year&rsquo;s last two cards
          are waiting:
        </p>
        <ul className="prose-reading mt-3 space-y-2 text-brand-ink-soft">
          <li>
            <strong className="text-brand-ink">Pluto ♇ · {ex.pluto}:</strong> the
            year&rsquo;s pressure card — the one deep challenge this year keeps
            circling back to.
          </li>
          <li>
            <strong className="text-brand-ink">Result ✦ · {ex.result}:</strong> where
            the pressure pays off — what the year is building toward if the
            Pluto work gets done.
          </li>
          <li>
            <strong className="text-brand-ink">Long Range · {ex.longRange}:</strong>{" "}
            one more signal, picked from the seven-year cycle instead of the
            yearly board: the through-line theme of the whole year. (Notice{" "}
            {ex.longRange} is also this card&rsquo;s Displacement — sometimes one
            card shows up wearing two jobs.)
          </li>
        </ul>
        <h3 id="all-90-spreads" className="mt-10 scroll-mt-10 font-serif text-2xl text-brand-ink">
          All 90 spreads
        </h3>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          Here are all ninety boards in full — the same arrangements the reading
          engine uses, not redrawn by hand. Open any number to see that board&rsquo;s
          seven rows and its crown. Board 0 is the Life Spread and board 1 is the
          Spirit Spread, so those two do double duty: they are the deck&rsquo;s fixed
          arrangements and the boards for ages 0 and 1.
        </p>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          The {ex.card} is marked on every board so you can watch one card travel.
          Open spread {ex.age}, then spread {ex.walkBoard}, and you are looking at
          exactly what the worked example above describes: where this card stands
          this year, and the board it walks.
        </p>
        <AllYearlySpreads highlight={ex.card} />
        <p className="prose-reading mt-6 text-brand-ink-soft">
          Want your own seats and walk?{" "}
          <Link href="/birth-card-calculator" className="text-gold underline underline-offset-4">
            Find your card free
          </Link>{" "}
          — the calculator places you on the board from one birthday.
        </p>
      </section>

      <section id="planetary-ruling-card" className="mt-12 scroll-mt-10">
        <h2 className="font-serif text-3xl text-brand-ink">The planetary ruling card — set by your astrology sign</h2>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          Your birthday does one more thing: it lands in an astrology sign, and
          every sign answers to a ruling planet. Find that planet&rsquo;s seat in
          your birth card&rsquo;s own walk, and the card sitting there is your{" "}
          <strong>planetary ruling card</strong> — the style layer people meet
          first, on top of the birth card underneath.
        </p>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          Worked example: {ex.birthdayLabel} falls in {ex.zodiac}{" "}
          <span aria-hidden="true">{ex.zodiacGlyph}</span>, and {ex.zodiac}{" "}
          answers to {ex.rulingPlanet}{" "}
          <span aria-hidden="true">{ex.rulingPlanetGlyph}</span>. The{" "}
          {ex.rulingPlanet} seat of the {ex.card}&rsquo;s walk holds the{" "}
          <strong>{ex.prc}</strong> — so a {ex.birthdayLabel} birthday is the{" "}
          {ex.card} expressed through the {ex.prc}.
        </p>
        <TableScroll label="Zodiac signs and their ruling planets" className="mt-5">
          <table className="w-full min-w-[24rem] border-collapse text-sm">
            <thead>
              <tr>
                <th className="border-b-2 border-gold px-2 py-2 text-left text-xs uppercase tracking-[0.14em] text-gold">Sign</th>
                <th className="border-b-2 border-gold px-2 py-2 text-left text-xs uppercase tracking-[0.14em] text-gold">Dates</th>
                <th className="border-b-2 border-gold px-2 py-2 text-left text-xs uppercase tracking-[0.14em] text-gold">Ruling planet</th>
              </tr>
            </thead>
            <tbody>
              {ZODIAC_TABLE.map((z) => (
                <tr key={z.sign} className={z.sign === ex.zodiac ? "bg-white/[0.06]" : ""}>
                  <td className="border-b border-white/10 px-2 py-2 text-brand-ink-soft">
                    <span aria-hidden="true" className="mr-1.5">{z.glyph}</span>
                    {z.sign}
                  </td>
                  <td className="border-b border-white/10 px-2 py-2 text-brand-ink-soft">{z.dates}</td>
                  <td className="border-b border-white/10 px-2 py-2 text-brand-ink-soft">{z.planet}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
        <p className="mt-3 text-xs text-brand-ink-soft">
          Cancer (the Moon), Leo (the Sun), and Scorpio (Mars and Pluto) get
          special handling, and some birthdays carry two ruling cards — the{" "}
          <Link href="/birth-card-calculator" className="text-gold underline underline-offset-4">
            free calculator
          </Link>{" "}
          applies the right rule automatically. More detail:{" "}
          <Link href="/planetary-ruling-card" className="text-gold underline underline-offset-4">
            the planetary ruling card, explained
          </Link>
          .
        </p>
      </section>

      <section id="planet-filters" className="mt-12 scroll-mt-10">
        <h2 className="font-serif text-3xl text-brand-ink">The planet symbols, and the filter each one provides</h2>
        <p className="prose-reading mt-3 text-brand-ink-soft">
          The planets here are not sky positions — they are labels for the seven
          seats every walk passes through, plus the two signal seats at the end.
          Each one filters the card sitting in it, like colored glass over the
          same lamp.
        </p>
        <div className="mt-5 space-y-3">
          {PLANET_FILTERS.map((p) => (
            <div key={p.planet} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="font-serif text-lg text-brand-ink">
                <span aria-hidden="true" className="mr-2 text-gold">{p.glyph}</span>
                {p.planet}
              </p>
              <p className="prose-reading mt-1 text-sm text-brand-ink-soft">{p.filter}</p>
            </div>
          ))}
        </div>
        <p className="prose-reading mt-5 text-brand-ink-soft">
          To see one card read through all seven of these filters side by side,
          use the{" "}
          <Link href="/52-day-period-meaning-tool" className="text-gold underline underline-offset-4">
            52-day period meaning tool
          </Link>
          .
        </p>
      </section>

      <section id="faq" className="mt-12 scroll-mt-10">
        <h2 className="eyebrow mb-4 text-gold">Spreads FAQ</h2>
        <div className="space-y-4">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h3 className="font-serif text-lg text-brand-ink">{f.q}</h3>
              <p className="prose-reading mt-2 text-sm text-brand-ink-soft">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

    </SeoShell>
  );
}
