import cardology from "./engine-core/engine.js";

// December 31 holds solar value 0, the Joker position. The legacy spread
// engine wraps 0 to 52, so every public or user-facing date→card path must
// resolve through this module — never through raw cardology.getBirthCard.

export type PublicBirth =
  | { kind: "card"; code: string; solarValue: number }
  | { kind: "joker"; code: "Joker"; solarValue: 0 };

export function resolvePublicBirth(month: number, day: number): PublicBirth {
  if (month === 12 && day === 31) {
    return { kind: "joker", code: "Joker", solarValue: 0 };
  }
  const [code, solarValue] = cardology.getBirthCard(month, day) as [string, number];
  return { kind: "card", code, solarValue };
}

// String form kept for existing SEO call sites. New code should prefer
// resolvePublicBirth so the Joker case cannot be silently treated as a card.
export function publicBirthCardCode(month: number, day: number): string {
  return resolvePublicBirth(month, day).code;
}
