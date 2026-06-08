// Pure-JS Cardology reading builder. Reproduces the output of the Python CLI
// `engine/cardology_cli.py --birthdate ... --target-date ... --json`
// byte-for-byte, with no child_process and no fs at request time.
//
// It uses the verified math core (lib/engine-core/engine.js) for all card math
// (birth card, PRC, spreads, active period, age, sy_nav, environment/displacement)
// and adds the Python engine's additive lookup layer (descriptions, suit/planet
// domains, three-lens interpretations, long-range cards, crown, deep dive) using
// the generated static tables under lib/engine-data/ + lib/card-meanings.json.

import { cardology } from "./engine-core/engine.js";
import type {
  Archetype,
  ArchetypeDescription,
  DailyCard,
  DailyCardEntry,
  DeepDive,
  Inputs,
  Interpretation,
  Karma,
  LongRange,
  LongRangeEntry,
  PeriodDetail,
  PlanetName,
  Reading,
  Spread,
} from "./types";

import THREE_LENS from "./card-meanings.json";
import CARD_DESCRIPTIONS from "./engine-data/card-descriptions.json";
import SUIT_DOMAINS from "./engine-data/suit-domains.json";
import PLANET_DOMAINS from "./engine-data/planet-domains.json";

const THREE_LENS_INTERPRETATIONS = THREE_LENS as Record<string, Interpretation>;
const CARD_DESCRIPTIONS_MAP = CARD_DESCRIPTIONS as Record<
  string,
  ArchetypeDescription
>;
const SUIT_DOMAINS_MAP = SUIT_DOMAINS as Record<string, string>;
const PLANET_DOMAINS_MAP = PLANET_DOMAINS as Record<string, string>;

const PLANET_NAMES = cardology.PLANET_NAMES as PlanetName[];

export class ReadingError extends Error {}

// --- date parsing (mirrors cardology_cli.parse_birthdate) -------------------

const ISO = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
const US = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
const US_DASH = /^(\d{1,2})[ -](\d{1,2})[ -](\d{4})$/;

interface MDY {
  month: number;
  day: number;
  year: number;
}

function parseBirthdate(value: string): MDY {
  const v = value.trim();
  let m = US.exec(v);
  if (m) return { month: +m[1], day: +m[2], year: +m[3] };
  m = ISO.exec(v);
  if (m) return { month: +m[2], day: +m[3], year: +m[1] };
  m = US_DASH.exec(v);
  if (m) return { month: +m[1], day: +m[2], year: +m[3] };
  throw new ReadingError(`invalid birthdate: ${value}`);
}

// Build a JS Date for a calendar date in local time so the core's day math
// (which uses getFullYear/getMonth/getDate and millisecond diffs) matches the
// Python `datetime.date` arithmetic.
//
// The core computes elapsed days via millisecond subtraction against an
// internally-built local-midnight birthday Date. That is DST-sensitive: a span
// crossing a spring-forward boundary loses an hour and can floor() one day
// short of Python's DST-immune `date` arithmetic. We anchor the target at local
// noon so a ±1h DST shift never crosses a day boundary, restoring parity with
// Python without touching the verified core math.
function localDate(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function parseTargetDate(value?: string): { date: Date; iso: string } {
  if (!value) {
    const now = new Date();
    const d = localDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
    return { date: d, iso: toISO(d) };
  }
  const m = ISO.exec(value.trim());
  if (!m) throw new ReadingError(`invalid target date: ${value}`);
  const year = +m[1];
  const month = +m[2];
  const day = +m[3];
  return { date: localDate(year, month, day), iso: pad4(year) + "-" + pad2(month) + "-" + pad2(day) };
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}
function pad4(n: number): string {
  return String(n).padStart(4, "0");
}
function toISO(d: Date): string {
  return pad4(d.getFullYear()) + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
}

// --- helpers mirroring the Python engine ------------------------------------

function lookupInterpretation(card: string | null | undefined): Interpretation | null {
  if (!card) return null;
  return THREE_LENS_INTERPRETATIONS[card] ?? null;
}

function lookupDescription(card: string | null | undefined): ArchetypeDescription | null {
  if (!card) return null;
  return CARD_DESCRIPTIONS_MAP[card] ?? null;
}

// get_position_meaning() in the engine build always returns None.
function getPositionMeaning(): string | null {
  return null;
}

interface PeriodDetailFull {
  card: string;
  interpretation: Interpretation | null;
  position_meaning: string | null;
}

function buildPeriods(cards: string[] | null): Record<PlanetName, PeriodDetailFull> {
  const periods = {} as Record<PlanetName, PeriodDetailFull>;
  const list = cards || [];
  const n = Math.min(7, list.length);
  for (let i = 0; i < n; i++) {
    const planet = PLANET_NAMES[i];
    const card = list[i];
    periods[planet] = {
      card,
      interpretation: lookupInterpretation(card),
      position_meaning: getPositionMeaning(),
    };
  }
  return periods;
}

// Mirrors engine.get_long_range_card(card, age).
function getLongRangeCard(card: string, age: number): LongRangeEntry | null {
  const cycle = Math.floor(age / 7);
  const position = age % 7;
  const spreadKey = cycle + 1;
  const spread = cardology.SPREADS[String(spreadKey)];
  if (!spread) return null;
  const cards7 = cardology.extractCards(card, spread, 7);
  if (!cards7 || position >= cards7.length) return null;
  return {
    card: cards7[position],
    planet: PLANET_NAMES[position],
    cycle,
    spread_used: spreadKey,
    all_7_in_cycle: cards7,
  };
}

// --- main builder -----------------------------------------------------------

export function buildReading(birthdate: string, targetDate?: string): Reading {
  const { month, day, year } = parseBirthdate(birthdate);
  const { date: target, iso: targetISO } = parseTargetDate(targetDate);

  const [bc, sv] = cardology.getBirthCard(month, day);
  const prc = cardology.getPlanetaryRulingCard(month, day);
  const prcPrimary = Array.isArray(prc) ? prc[0] : prc;
  const prcSecondary = Array.isArray(prc) && prc.length > 1 ? prc[1] : null;

  const age = cardology.calculateAge(month, day, year, target);
  const syNav = Math.max(0, Math.min(90, age + 1));
  const spreadNav = cardology.SPREADS[String(syNav)];

  const bc9 = cardology.extractCards(bc, spreadNav, 9);
  const prc9 = prcPrimary ? cardology.extractCards(prcPrimary, spreadNav, 9) : null;

  const [apPlanetRaw, , dayInYear] = cardology.getActivePeriod(month, day, target);
  const apPlanet = apPlanetRaw as PlanetName;

  const bcPeriodsDetailed = buildPeriods(bc9);
  const prcPeriodsDetailed = buildPeriods(prc9);

  const bcPeriods = {} as Record<PlanetName, string>;
  const prcPeriods = {} as Record<PlanetName, string>;
  for (const p of Object.keys(bcPeriodsDetailed) as PlanetName[]) {
    bcPeriods[p] = bcPeriodsDetailed[p].card;
  }
  for (const p of Object.keys(prcPeriodsDetailed) as PlanetName[]) {
    prcPeriods[p] = prcPeriodsDetailed[p].card;
  }

  const bcSuit = cardology.getCardSuit(bc);

  const archetype: Archetype = {
    birth_card: bc,
    solar_value: sv,
    suit_domain: (bcSuit ? SUIT_DOMAINS_MAP[bcSuit] : undefined) ?? (null as unknown as string),
    prc: prcPrimary as string,
    prc_secondary: prcSecondary,
    description: lookupDescription(bc) as ArchetypeDescription,
    prc_description: lookupDescription(prcPrimary) as ArchetypeDescription,
  };

  const bcSpread: Spread = {
    anchor: bc,
    periods: bcPeriods,
    periods_detailed: bcPeriodsDetailed as Record<PlanetName, PeriodDetail>,
    pluto: bc9 && bc9.length > 7 ? bc9[7] : (null as unknown as string),
    pluto_meaning: null,
    result: bc9 && bc9.length > 8 ? bc9[8] : (null as unknown as string),
    result_meaning: null,
  };

  const prcSpread: Spread = {
    anchor: prcPrimary as string,
    periods: prcPeriods,
    periods_detailed: prcPeriodsDetailed as Record<PlanetName, PeriodDetail>,
    pluto: prc9 && prc9.length > 7 ? prc9[7] : (null as unknown as string),
    pluto_meaning: null,
    result: prc9 && prc9.length > 8 ? prc9[8] : (null as unknown as string),
    result_meaning: null,
  };

  const apBcCard = bcPeriods[apPlanet];
  const apPrcCard = prcPeriods[apPlanet];

  const activePeriod = {
    planet: apPlanet,
    domain: PLANET_DOMAINS_MAP[apPlanet],
    bc_card: apBcCard ?? (null as unknown as string),
    prc_card: apPrcCard ?? (null as unknown as string),
    interpretation_bc: lookupInterpretation(apBcCard) as Interpretation,
    interpretation_prc: lookupInterpretation(apPrcCard) as Interpretation,
    position_meaning_bc: null,
    position_meaning_prc: null,
  };

  // --- Personal daily ("weekly") card -------------------------------------
  // Drill one level past the active 52-day planetary period: each period is
  // split into 7 sub-periods (~52/7 ≈ 7.43 days). The day's card is the
  // sub_index-th card extracted from the active period card in the same
  // current-age spread (spreadNav). Mirrors the engine's stubbed
  // WEEKLY_CARD_MEANINGS granularity.
  const apIdx = Math.max(0, PLANET_NAMES.indexOf(apPlanet));
  const periodStart = 1 + apIdx * 52; // day-in-year where this period begins
  const dayInPeriod = Math.max(0, dayInYear - periodStart);
  const subLen = 52 / 7;
  const subIndex = Math.min(6, Math.floor(dayInPeriod / subLen));
  const subPlanet = PLANET_NAMES[subIndex];

  function drillDaily(periodCard: string | undefined | null): DailyCardEntry {
    const seven = periodCard ? cardology.extractCards(periodCard, spreadNav, 7) : null;
    const card = seven && subIndex < seven.length ? seven[subIndex] : (null as unknown as string);
    return {
      card,
      interpretation: lookupInterpretation(card),
      source_period_card: (periodCard ?? null) as unknown as string,
    };
  }

  const daily: DailyCard = {
    sub_planet: subPlanet,
    sub_index: subIndex,
    domain: PLANET_DOMAINS_MAP[subPlanet],
    period_planet: apPlanet,
    day_in_period: dayInPeriod,
    sub_length_days: subLen,
    bc: drillDaily(apBcCard),
    prc: drillDaily(apPrcCard),
    method:
      "active 52-day period card → 7 sub-period cards via SPREADS[sy_nav]; sub_index = floor(day_in_period / (52/7))",
  };

  const longRange: LongRange = {
    bc: getLongRangeCard(bc, age) as LongRangeEntry,
    prc: (prcPrimary ? getLongRangeCard(prcPrimary, age) : null) as LongRangeEntry,
  };

  const karma: Karma = {
    bc_lifetime: cardology.getEnvironmentDisplacement(bc, 1) as Karma["bc_lifetime"],
  };

  const inputs: Inputs = {
    birthdate: `${pad2(month)}/${pad2(day)}/${year}`,
    birth_month: month,
    birth_day: day,
    birth_year: year,
    target_date: targetISO,
    calculation_source: "local deterministic Cardology engine via cli/cardology_cli.py",
  };

  const deepDive = buildDeepDive(bc, karma.bc_lifetime);

  return {
    archetype,
    timing: { age, sy_nav: syNav, crown: spreadNav.crown },
    birth_card_spread: bcSpread,
    prc_spread: prcSpread,
    active_period: activePeriod,
    daily,
    long_range: longRange,
    karma,
    inputs,
    deep_dive: deepDive,
  };
}

// Mirrors cardology_cli.build_deep_dive(blueprint).
function buildDeepDive(
  birthCard: string,
  bcLifetime: { environment: string; displacement: string } | null,
): DeepDive {
  const spread = cardology.SPREADS["1"];
  const lifeCards = (birthCard && spread ? cardology.extractCards(birthCard, spread, 9) : []) || [];

  const periods = {} as Record<
    PlanetName,
    { planet: PlanetName; card: string | null; interpretation: Interpretation | null; position_meaning: string | null }
  >;
  for (let idx = 0; idx < PLANET_NAMES.length; idx++) {
    const planet = PLANET_NAMES[idx];
    const card = idx < lifeCards.length ? lifeCards[idx] : null;
    periods[planet] = {
      planet,
      card,
      interpretation: card ? lookupInterpretation(card) : null,
      position_meaning: card ? getPositionMeaning() : null,
    };
  }

  let lifetimeRaw = bcLifetime;
  if (lifetimeRaw == null && birthCard) {
    lifetimeRaw = cardology.getEnvironmentDisplacement(birthCard, 1);
  }
  const raw = lifetimeRaw || ({} as Partial<{ environment: string; displacement: string }>);

  return {
    anchor: birthCard,
    life_spread_year: 1,
    life_path: {
      source: "birth-card anchor extracted from SPREADS['1']",
      cards: lifeCards.slice(0, 7),
      periods: periods as DeepDive["life_path"]["periods"],
      // pluto/result are emitted by the Python CLI under life_path
      pluto: lifeCards.length > 7 ? lifeCards[7] : null,
      result: lifeCards.length > 8 ? lifeCards[8] : null,
    } as DeepDive["life_path"],
    lifetime_karma: {
      source: "get_environment_displacement(birth_card, 1)",
      gift: {
        label: "Lifetime Gift",
        card: raw.environment ?? null,
        source_field: "environment",
      },
      challenge: {
        label: "Lifetime Challenge",
        card: raw.displacement ?? null,
        source_field: "displacement",
      },
      raw: lifetimeRaw,
    },
  };
}
