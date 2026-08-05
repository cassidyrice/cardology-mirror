// Type surface for the verified JS engine core (engine.js). Everything declared
// here is an official, supported import — it now covers the primitives used by
// lib/reading.ts AND the ones public surfaces depend on (life-path spreads,
// seo-cards, scripts/validate-public-truth.ts). The math itself lives in
// engine.js and must not be modified; add declarations here when a public
// consumer needs one, never widen engine.js to match a type.

export interface Spread {
  grid: string[][];
  crown: string[];
}

export interface CardologyCore {
  P: number[];
  SPREADS: Record<string, Spread>;
  getSpread(index: number): Spread;
  cardsFrom(birthCard: string, spreadIndex: number, count?: number): string[] | null;

  getCardSuit(card: string): string | null;
  getCardRank(card: string): string | null;

  getBirthCard(month: number, day: number): [string, number];
  getPlanetaryRulingCard(month: number, day: number): string | string[] | null;
  calculateAge(
    birthMonth: number,
    birthDay: number,
    birthYear: number,
    targetDate: Date,
  ): number;
  extractCards(card: string, spread: Spread, count?: number): string[] | null;
  getActivePeriod(
    birthMonth: number,
    birthDay: number,
    targetDate: Date,
  ): [string, number, number];
  getEnvironmentDisplacement(
    card: string,
    spreadYear: number,
  ): { environment: string; displacement: string } | null;

  interpret(
    card: string | null,
    planet?: string | null,
  ): {
    card: string | null;
    rank: string | null;
    rank_word: string | null;
    suit: string | null;
    suit_word: string | null;
    planet?: string;
    planet_word?: string | null;
  };

  getSeptennial(
    birthCard: string,
    age: number,
  ): {
    cycle: number;
    spread_used: number;
    current_year_in_cycle: number;
    current_card: string;
    current_meaning: Record<string, unknown>;
    years: Record<string, unknown>[];
  } | null;

  // targetDate is intentionally REQUIRED in these signatures even though the
  // runtime defaults to `new Date()`: an argless call from a static builder
  // bakes build-time "today" into pages that then claim current timing.
  // Timing output must always be attributed to an explicit date.
  getWeekly(
    birthCard: string,
    birthYear: number,
    birthMonth: number,
    birthDay: number,
    targetDate: Date,
  ): {
    weeks_lived: number;
    spread_used: number;
    current_weekday: string;
    current_card: string;
    current_meaning: Record<string, unknown>;
    days: Record<string, unknown>[];
  } | null;

  calculateBlueprint(
    birthMonth: number,
    birthDay: number,
    birthYear: number,
    targetDate: Date | string,
  ): Record<string, unknown>;

  PLANET_NAMES: string[];
}

export const cardology: CardologyCore;
export default cardology;
