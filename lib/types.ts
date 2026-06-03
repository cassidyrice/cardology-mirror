// Types mirroring the deterministic Cardology engine JSON
// (python3 engine/cardology_cli.py --birthdate YYYY-MM-DD --target-date YYYY-MM-DD --json)
// Card strings use unicode suit glyphs, e.g. "8♦", "K♠".

export type CardCode = string;

export interface Interpretation {
  name: string;
  under: string;
  sweet_spot: string;
  over: string;
}

export interface ArchetypeDescription {
  title: string;
  core_identity: string;
  gifts: string;
  shadow: string;
  life_direction: string;
  algorithm_gateway: string;
}

export interface Archetype {
  birth_card: CardCode;
  solar_value: number;
  suit_domain: string;
  prc: CardCode;
  prc_secondary: CardCode | null;
  description: ArchetypeDescription;
  prc_description: ArchetypeDescription;
}

export interface Timing {
  age: number;
  sy_nav: number;
  crown: CardCode[];
}

export interface PeriodDetail {
  card: CardCode;
  interpretation: Interpretation;
  position_meaning: string | null;
}

export type PlanetName =
  | "Mercury" | "Venus" | "Mars" | "Jupiter"
  | "Saturn" | "Uranus" | "Neptune";

export interface Spread {
  anchor: CardCode;
  periods: Record<PlanetName, CardCode>;
  periods_detailed: Record<PlanetName, PeriodDetail>;
  pluto: CardCode;
  pluto_meaning: string | null;
  result: CardCode;
  result_meaning: string | null;
}

export interface ActivePeriod {
  planet: PlanetName;
  domain: string;
  bc_card: CardCode;
  prc_card: CardCode;
  interpretation_bc: Interpretation;
  interpretation_prc: Interpretation;
  position_meaning_bc: string | null;
  position_meaning_prc: string | null;
}

export interface LongRangeEntry {
  card: CardCode;
  planet: PlanetName;
  cycle: number;
  spread_used: number;
  all_7_in_cycle: CardCode[];
}

export interface LongRange {
  bc: LongRangeEntry;
  prc: LongRangeEntry;
}

export interface Karma {
  bc_lifetime: {
    environment: CardCode;
    displacement: CardCode;
  };
}

export interface Inputs {
  birthdate: string;
  birth_month: number;
  birth_day: number;
  birth_year: number;
  target_date: string;
  calculation_source: string;
}

export interface DeepDive {
  anchor: CardCode;
  life_spread_year: number;
  life_path: {
    source: string;
    cards: CardCode[];
    periods: Record<PlanetName, PeriodDetail>;
    pluto?: CardCode | null;
    result?: CardCode | null;
  };
  lifetime_karma?: unknown;
}

export interface Reading {
  archetype: Archetype;
  timing: Timing;
  birth_card_spread: Spread;
  prc_spread: Spread;
  active_period: ActivePeriod;
  long_range: LongRange;
  karma: Karma;
  inputs: Inputs;
  deep_dive: DeepDive;
}

export const PLANET_ORDER: PlanetName[] = [
  "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune",
];

// Each planetary period is ~52 days; index 0 = Mercury starts on birthday.
export const PERIOD_DAYS = 52;
