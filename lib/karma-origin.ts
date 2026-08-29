import cardology from "./engine-core/engine.js";
import { parseIsoCalendarDate } from "./worker-seo-routes";
import { resolvePublicBirth } from "./birth-card-truth";

export type SpreadCell =
  | { kind: "grid"; row: number; col: number; card: string }
  | { kind: "crown"; index: number; card: string };

const FIXED_KARMA = new Set(["J♥", "8♣", "K♠"]);

export function isFixedKarmaCard(card: string): boolean {
  return FIXED_KARMA.has(card);
}

export function findCardOnSpread(card: string, spreadYear: string): SpreadCell | null {
  const spread = cardology.SPREADS[spreadYear];
  if (!spread) return null;
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 7; col++) {
      if (spread.grid[row][col] === card) {
        return { kind: "grid", row, col, card };
      }
    }
  }
  for (let index = 0; index < spread.crown.length; index++) {
    if (spread.crown[index] === card) {
      return { kind: "crown", index, card };
    }
  }
  return null;
}

/** Birth card's cell on the spirit / year-0 spread (solar-mapped card). */
export function spiritSolarCell(birthCard: string): SpreadCell | null {
  if (birthCard === "Joker") return null;
  return findCardOnSpread(birthCard, "0");
}

export function lifeSpreadCell(card: string): SpreadCell | null {
  return findCardOnSpread(card, "1");
}

export function lifetimeKarma(birthCard: string): {
  environment: string;
  displacement: string;
} | null {
  if (birthCard === "Joker" || isFixedKarmaCard(birthCard)) return null;
  return cardology.getEnvironmentDisplacement(birthCard, 1);
}

export function spiritSpread(): { grid: string[][]; crown: string[] } {
  return cardology.SPREADS["0"];
}

export function lifeSpread(): { grid: string[][]; crown: string[] } {
  return cardology.SPREADS["1"];
}

export function solarValueForIsoDate(isoDate: string): number | null {
  const parsed = parseIsoCalendarDate(isoDate);
  if (!parsed) return null;
  return resolvePublicBirth(parsed.month, parsed.day).solarValue;
}

export function equationPreview(isoDate: string): {
  month: number;
  day: number;
  solarValue: number;
  card: string;
  kind: "card" | "joker";
} | null {
  const parsed = parseIsoCalendarDate(isoDate);
  if (!parsed) return null;
  const birth = resolvePublicBirth(parsed.month, parsed.day);
  return {
    month: parsed.month,
    day: parsed.day,
    solarValue: birth.solarValue,
    card: birth.code,
    kind: birth.kind,
  };
}
