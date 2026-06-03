// Minimal type surface for the verified JS engine core (engine.js).
// Only the primitives used by lib/reading.ts are typed; the math itself is in
// engine.js and must not be modified.

export interface Spread {
  grid: string[][];
  crown: string[];
}

export interface CardologyCore {
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

  PLANET_NAMES: string[];
}

export const cardology: CardologyCore;
export default cardology;
