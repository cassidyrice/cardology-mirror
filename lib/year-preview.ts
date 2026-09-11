import type { YearBlueprint, YearCard } from "./year-blueprint";

/** Public contract: never send the paid model to a preview client. */
export interface YearPreviewData {
  birthdate: string;
  targetDate: string;
  birthCard: YearCard;
  introduction: string;
  current: { planet: string; startLabel: string; endLabel: string };
}

export function toYearPreview(year: YearBlueprint): YearPreviewData {
  return {
    birthdate: year.birthdate,
    targetDate: year.targetDate,
    birthCard: {
      code: year.birthCard.code,
      rank: year.birthCard.rank,
      suit: year.birthCard.suit,
      red: year.birthCard.red,
      slug: year.birthCard.slug,
      title: year.birthCard.title,
      name: year.birthCard.name,
    },
    introduction: year.birthCopy.light,
    current: {
      planet: year.current.planet,
      startLabel: year.current.startLabel,
      endLabel: year.current.endLabel,
    },
  };
}
