import cardology from "@/lib/engine-core/engine.js";
import { parseCard, type Suit } from "@/lib/cards";
import { publicBirthCardCode } from "@/lib/birth-card-truth";
import { parseIsoCalendarDate } from "./worker-seo-routes";

export {
  birthdayWorkerLinkForReveal,
  birthdayWorkerPathFromIsoDate,
} from "./worker-seo-routes";
export type { BirthdayWorkerLink } from "./worker-seo-routes";

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

export type BirthCardReveal = Readonly<{
  birthdate: string;
  result: BirthCardResult;
}>;

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
  const parsed = parseIsoCalendarDate(isoDate);
  if (!parsed) return null;

  return calculateBirthCard(parsed.month, parsed.day);
}

export function calculateBirthCardRevealFromIsoDate(
  isoDate: string,
): BirthCardReveal | null {
  const result = calculateBirthCardFromIsoDate(isoDate);
  return result ? { birthdate: isoDate, result } : null;
}

export function birthCardSlug(code: string): string | null {
  const card = parseCard(code);
  if (!card) return null;
  return `${RANK_SLUG[card.rank] ?? card.rank}-of-${card.suit as Suit}`;
}
