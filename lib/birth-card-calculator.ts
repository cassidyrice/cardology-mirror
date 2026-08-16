import cardology from "@/lib/engine-core/engine.js";
import { parseCard, type Suit } from "@/lib/cards";
import { publicBirthCardCode } from "@/lib/birth-card-truth";

const RANK_SLUG: Record<string, string> = {
  A: "ace",
  J: "jack",
  Q: "queen",
  K: "king",
};

export type BirthCardResult = {
  birthCard: string;
  rulingCards: string[];
};

export function calculateBirthCard(
  month: number,
  day: number,
): BirthCardResult | null {
  if (!Number.isInteger(month) || !Number.isInteger(day)) return null;

  const probe = new Date(Date.UTC(2000, month - 1, day));
  if (probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) {
    return null;
  }

  try {
    const birthCard = publicBirthCardCode(month, day);
    const ruling = cardology.getPlanetaryRulingCard(month, day);
    const rulingCards = Array.isArray(ruling) ? ruling : ruling ? [ruling] : [];
    if (!birthCard || birthCard === "Unknown") return null;
    return { birthCard, rulingCards };
  } catch {
    return null;
  }
}

export function calculateBirthCardFromIsoDate(
  isoDate: string,
): BirthCardResult | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || month < 1 || month > 12) return null;

  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day < 1 || day > daysInMonth[month - 1]) return null;

  return calculateBirthCard(month, day);
}

export function birthCardSlug(code: string): string | null {
  const card = parseCard(code);
  if (!card) return null;
  return `${RANK_SLUG[card.rank] ?? card.rank}-of-${card.suit as Suit}`;
}
