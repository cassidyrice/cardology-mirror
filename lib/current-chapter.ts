import { parseCard } from "./cards";
import { buildReading, JokerNotSupportedError } from "./reading";

export type CurrentChapter = {
  planet: string;
  card: string;
  cardLabel: string;
};

/** Active 52-day planetary stretch for a birthday on a target day. Joker → null. */
export function currentChapterFor(
  birthdate: string,
  targetDate?: string,
): CurrentChapter | null {
  try {
    const reading = buildReading(birthdate, targetDate);
    const card = reading.active_period.bc_card;
    if (!card) return null;
    const cardLabel = parseCard(card)?.label;
    if (!cardLabel) return null;
    return {
      planet: reading.active_period.planet,
      card,
      cardLabel,
    };
  } catch (error) {
    if (error instanceof JokerNotSupportedError) return null;
    return null;
  }
}
