import cardology from "./engine-core/engine.js";

// December 31 holds solar value 0, the Joker position. The legacy spread
// engine wraps 0 to 52, so public pages use this boundary until every private
// spread screen is made Joker-aware.
export function publicBirthCardCode(month: number, day: number): string {
  if (month === 12 && day === 31) return "Joker";
  const [birthCode] = cardology.getBirthCard(month, day) as [string, number];
  return birthCode;
}
