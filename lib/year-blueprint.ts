// 52xSeven Blueprint — deterministic year model built from the Cardology engine.
// Everything here traces to engine data (spread math, planetary periods,
// Long Range, karma) plus the reviewed copy library in year-copy.ts. No LLM.

import { cardology } from "./engine-core/engine.js";
import { getReading } from "./engine";
import { cardSlugFromCode } from "./blueprint";
import { CARD_COPY, cardCopy, planetCopy, type CardCopy } from "./year-copy";
import CARD_DESCRIPTIONS from "./engine-data/card-descriptions.json";
import type { PlanetName, Reading } from "./types";

type CardDescription = { title: string; core_identity: string; shadow: string };
const DESCRIPTIONS = CARD_DESCRIPTIONS as Record<string, CardDescription>;

export const PLANETS: PlanetName[] = [
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
];

export interface YearCard {
  code: string;
  rank: string;
  suit: "♥" | "♣" | "♦" | "♠";
  red: boolean;
  slug: string;
  title: string;
  name: string;
}

export interface YearChapter {
  planet: PlanetName;
  index: number;
  card: YearCard;
  copy: CardCopy;
  frame: string;
  pressure: string;
  /** ISO dates, inclusive. */
  start: string;
  end: string;
  startLabel: string;
  endLabel: string;
  lengthDays: number;
  state: "done" | "now" | "next";
  /** Only set on the current chapter. */
  dayInChapter?: number;
  daysLeft?: number;
  progress?: number;
}

export interface YearBlueprint {
  birthdate: string;
  birthdateDisplay: string;
  targetDate: string;
  age: number;
  yearStart: string;
  yearEnd: string;
  yearStartLabel: string;
  yearEndLabel: string;
  birthCard: YearCard;
  birthCopy: CardCopy;
  birthIdentity: string;
  birthShadowLong: string;
  chapters: YearChapter[];
  current: YearChapter;
  next: YearChapter | null;
  pluto: { card: YearCard; copy: CardCopy };
  result: { card: YearCard; copy: CardCopy };
  longRange: {
    card: YearCard;
    copy: CardCopy;
    cycleStartAge: number;
    cycleEndAge: number;
    yearInCycle: number;
  };
  karma: {
    environment: { card: YearCard; copy: CardCopy } | null;
    displacement: { card: YearCard; copy: CardCopy } | null;
    fixed: boolean;
  };
  /** Which spread index each element resolved to — for the methodology note. */
  spreads: { period: number; karma: number; longRange: number };
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function iso(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function label(d: Date): string {
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function utc(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m - 1, d));
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 86_400_000);
}

export function toYearCard(code: string): YearCard {
  const suit = code.slice(-1) as YearCard["suit"];
  const rank = code.slice(0, -1);
  const desc = DESCRIPTIONS[code];
  const RANK_WORDS: Record<string, string> = {
    A: "Ace", "2": "Two", "3": "Three", "4": "Four", "5": "Five", "6": "Six",
    "7": "Seven", "8": "Eight", "9": "Nine", "10": "Ten", J: "Jack", Q: "Queen", K: "King",
  };
  const SUIT_WORDS: Record<string, string> = {
    "♥": "Hearts", "♣": "Clubs", "♦": "Diamonds", "♠": "Spades",
  };
  return {
    code,
    rank,
    suit,
    red: suit === "♥" || suit === "♦",
    slug: cardSlugFromCode(code),
    title: desc?.title ?? "",
    name: `${RANK_WORDS[rank] ?? rank} of ${SUIT_WORDS[suit] ?? ""}`.trim(),
  };
}

function withCopy(code: string) {
  return { card: toYearCard(code), copy: cardCopy(code) };
}

/**
 * Build the year model. `targetDate` defaults to today (UTC). Birthday is day 1.
 * Mercury 1–52 … Uranus 261–312, Neptune 313 through the day before the next
 * birthday (53 or 54 days) — matches the engine's getActivePeriod ranges.
 */
export async function buildYearBlueprint(
  birthdate: string,
  targetDate?: string,
): Promise<YearBlueprint> {
  const r: Reading = await getReading(birthdate, targetDate);
  const [by, bm, bd] = birthdate.split("-").map(Number);
  const target = targetDate ? utc(...(targetDate.split("-").map(Number) as [number, number, number])) : new Date();
  const targetUtc = utc(target.getUTCFullYear(), target.getUTCMonth() + 1, target.getUTCDate());

  // Most recent birthday on or before target. Feb 29 falls back to Feb 28.
  const bdayIn = (y: number) => {
    const d = utc(y, bm, bd);
    return d.getUTCMonth() !== bm - 1 ? utc(y, bm, bd - 1) : d;
  };
  let yearStart = bdayIn(targetUtc.getUTCFullYear());
  if (yearStart > targetUtc) yearStart = bdayIn(targetUtc.getUTCFullYear() - 1);
  const nextBirthday = bdayIn(yearStart.getUTCFullYear() + 1);
  const yearEnd = addDays(nextBirthday, -1);
  const dayInYear = Math.floor((targetUtc.getTime() - yearStart.getTime()) / 86_400_000) + 1;

  const age = r.timing.age;
  const periodSpread = r.timing.sy_nav; // (age + 1) mod 90, already applied
  const karmaSpread = ((age % 90) + 90) % 90;
  const bc = r.archetype.birth_card;

  const periods = r.birth_card_spread.periods;
  const chapters: YearChapter[] = PLANETS.map((planet, i) => {
    const start = addDays(yearStart, i * 52);
    const end = i === 6 ? yearEnd : addDays(start, 51);
    const startDay = i * 52 + 1;
    const endDay = Math.floor((end.getTime() - yearStart.getTime()) / 86_400_000) + 1;
    const state: YearChapter["state"] =
      dayInYear > endDay ? "done" : dayInYear >= startDay ? "now" : "next";
    const code = periods[planet];
    const pc = planetCopy(planet);
    const ch: YearChapter = {
      planet,
      index: i,
      card: toYearCard(code),
      copy: cardCopy(code),
      frame: pc.frame,
      pressure: pc.pressure,
      start: iso(start),
      end: iso(end),
      startLabel: label(start),
      endLabel: label(end),
      lengthDays: endDay - startDay + 1,
      state,
    };
    if (state === "now") {
      ch.dayInChapter = dayInYear - startDay + 1;
      ch.daysLeft = endDay - dayInYear;
      ch.progress = Math.round((ch.dayInChapter / ch.lengthDays) * 100);
    }
    return ch;
  });

  const current = chapters.find((c) => c.state === "now") ?? chapters[6];
  const next = chapters[current.index + 1] ?? null;

  // Long Range: seven-year cycle, spread floor(age/7)+1, position age mod 7.
  const lr = r.long_range.bc;
  const cycleStartAge = Math.floor(age / 7) * 7;

  // Yearly karma reads against spread `age mod 90` (spread 0 = reference).
  const fixed = ["8♣", "J♥", "K♠"].includes(bc);
  const k = fixed ? null : cardology.getEnvironmentDisplacement(bc, karmaSpread);

  const birthDesc = DESCRIPTIONS[bc];

  return {
    birthdate,
    birthdateDisplay: `${MONTHS[bm - 1]} ${bd}, ${by}`,
    targetDate: iso(targetUtc),
    age,
    yearStart: iso(yearStart),
    yearEnd: iso(yearEnd),
    yearStartLabel: `${label(yearStart)}, ${yearStart.getUTCFullYear()}`,
    yearEndLabel: `${label(yearEnd)}, ${yearEnd.getUTCFullYear()}`,
    birthCard: toYearCard(bc),
    birthCopy: cardCopy(bc),
    birthIdentity: birthDesc?.core_identity ?? "",
    birthShadowLong: birthDesc?.shadow ?? "",
    chapters,
    current,
    next,
    pluto: withCopy(r.birth_card_spread.pluto),
    result: withCopy(r.birth_card_spread.result),
    longRange: {
      ...withCopy(lr.card),
      cycleStartAge,
      cycleEndAge: cycleStartAge + 6,
      yearInCycle: (age % 7) + 1,
    },
    karma: {
      environment: k ? withCopy(k.environment) : null,
      displacement: k ? withCopy(k.displacement) : null,
      fixed,
    },
    spreads: { period: periodSpread, karma: karmaSpread, longRange: lr.spread_used },
  };
}

/** True when the copy library covers the card (used by the truth validator). */
export function hasCardCopy(code: string): boolean {
  return code in CARD_COPY;
}
