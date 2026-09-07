// Yearly Timing Map — data model. Pure, edge-safe: engine + cycle math only.
//
// The map is the buyer's current Cardology year (birthday → eve of next
// birthday) as seven 52-day planetary periods, plus the year's fixed signals
// (Long Range, Pluto, Result, Environment, Displacement). Rendering lives in
// ./render.ts; this file only shapes the numbers.

import { buildCycle } from "@/components/timing/cycle";
import { parseCard } from "@/lib/cards";
import { buildReading, JokerNotSupportedError } from "@/lib/reading";
import { PLANET_ORDER, type PlanetName, type Reading } from "@/lib/types";

export const TIMING_MAP_SLUG = "yearly-timing-map";
export const TIMING_MAP_LABEL = "Yearly Timing Map";

export interface TimingMapPeriod {
  index: number; // 0..6
  planet: PlanetName;
  card: string; // e.g. "8♦"
  /** Day offsets from the cycle birthday: [startDay, endDay). */
  startDay: number;
  endDay: number;
  days: number;
  startISO: string;
  /** Inclusive last day of the period. */
  lastISO: string;
  startLabel: string;
  lastLabel: string;
  active: boolean;
}

export type SatelliteKey =
  | "long-range"
  | "pluto"
  | "result"
  | "environment"
  | "displacement";

export interface TimingMapSatellite {
  key: SatelliteKey;
  label: string;
  card: string | null;
  note: string;
}

export interface TimingMapModel {
  birthdate: string;
  birthCard: string;
  birthCardLabel: string;
  rulingCard: string;
  age: number;
  cycleStartISO: string;
  cycleEndISO: string; // eve of the next birthday (inclusive)
  cycleStartLabel: string;
  cycleEndLabel: string;
  yearDays: number;
  todayISO: string;
  todayLabel: string;
  todayDay: number; // offset from the cycle birthday, 0-based
  activePlanet: PlanetName;
  dayInActive: number; // 1-based, for "day 5 of 52"
  periods: TimingMapPeriod[];
  satellites: TimingMapSatellite[];
  fixedCard: boolean;
}

export class TimingMapJokerError extends Error {
  constructor() {
    super("December 31 is the Joker — no yearly spread");
    this.name = "TimingMapJokerError";
  }
}

const MS_PER_DAY = 86_400_000;
const FMT = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const FMT_YEAR = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function atMidnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function nextBirthday(cycleStart: Date): Date {
  const next = new Date(cycleStart);
  next.setFullYear(next.getFullYear() + 1);
  return atMidnight(next);
}

function satellites(r: Reading): { list: TimingMapSatellite[]; fixed: boolean } {
  const karma = r.karma.bc_lifetime;
  const fixed = karma === null;
  const list: TimingMapSatellite[] = [
    {
      key: "long-range",
      label: "Long Range",
      card: r.long_range.bc.card,
      note: `7-year cycle ${r.long_range.bc.cycle} · ${r.long_range.bc.planet}`,
    },
    {
      key: "pluto",
      label: "Pluto",
      card: r.birth_card_spread.pluto,
      note: "The year's lesson",
    },
    {
      key: "result",
      label: "Result",
      card: r.birth_card_spread.result,
      note: "What the year resolves toward",
    },
    {
      key: "environment",
      label: "Environment",
      card: karma ? karma.environment : null,
      note: karma ? "The setting you draw in" : "Fixed card · no environment",
    },
    {
      key: "displacement",
      label: "Displacement",
      card: karma ? karma.displacement : null,
      note: karma ? "The seat you occupy" : "Fixed card · no displacement",
    },
  ];
  return { list, fixed };
}

/**
 * Build the map model for a birthday as of `today`. Throws
 * TimingMapJokerError for December 31 (the Joker has no yearly spread).
 */
export function buildTimingMapModel(
  birthdate: string,
  today: Date = new Date(),
): TimingMapModel {
  const todayMidnight = atMidnight(today);
  let reading: Reading;
  try {
    reading = buildReading(birthdate, toISO(todayMidnight));
  } catch (e) {
    if (e instanceof JokerNotSupportedError) throw new TimingMapJokerError();
    throw e;
  }

  const cycle = buildCycle(birthdate, todayMidnight);
  const cycleStart = atMidnight(cycle.birthdayThisCycle);
  const cycleEndExclusive = nextBirthday(cycleStart);
  const yearDays = Math.round(
    (cycleEndExclusive.getTime() - cycleStart.getTime()) / MS_PER_DAY,
  );
  const todayDay = Math.max(
    0,
    Math.min(
      yearDays - 1,
      Math.round((todayMidnight.getTime() - cycleStart.getTime()) / MS_PER_DAY),
    ),
  );

  const spreadPeriods = reading.birth_card_spread.periods;
  const activePlanet = reading.active_period.planet;
  const periods: TimingMapPeriod[] = PLANET_ORDER.map((planet, index) => {
    const startDay = index * 52;
    // Neptune runs to the eve of the next birthday (the ~9-10 leftover days).
    const endDay = index === PLANET_ORDER.length - 1 ? yearDays : Math.min(startDay + 52, yearDays);
    const start = addDays(cycleStart, startDay);
    const last = addDays(cycleStart, endDay - 1);
    return {
      index,
      planet,
      card: spreadPeriods[planet],
      startDay,
      endDay,
      days: endDay - startDay,
      startISO: toISO(start),
      lastISO: toISO(last),
      startLabel: FMT.format(start),
      lastLabel: FMT.format(last),
      active: planet === activePlanet,
    };
  });

  const activeIndex = Math.max(0, periods.findIndex((p) => p.active));
  const dayInActive = Math.max(1, todayDay - periods[activeIndex].startDay + 1);
  const { list, fixed } = satellites(reading);
  const birthCard = reading.archetype.birth_card;
  const parsed = parseCard(birthCard);
  const cycleEnd = addDays(cycleEndExclusive, -1);

  return {
    birthdate,
    birthCard,
    birthCardLabel: parsed?.label ?? birthCard,
    rulingCard: reading.archetype.prc,
    age: reading.timing.age,
    cycleStartISO: toISO(cycleStart),
    cycleEndISO: toISO(cycleEnd),
    cycleStartLabel: FMT_YEAR.format(cycleStart),
    cycleEndLabel: FMT_YEAR.format(cycleEnd),
    yearDays,
    todayISO: toISO(todayMidnight),
    todayLabel: FMT.format(todayMidnight),
    todayDay,
    activePlanet,
    dayInActive,
    periods,
    satellites: list,
    fixedCard: fixed,
  };
}
