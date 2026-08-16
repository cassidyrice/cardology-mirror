export type IsoCalendarDate = Readonly<{
  year: number;
  month: number;
  day: number;
}>;

const MONTH_SLUGS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const;

const SUIT_SLUGS = ["hearts", "clubs", "diamonds", "spades"] as const;
const RANK_SLUGS = [
  "ace",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "jack",
  "queen",
  "king",
] as const;
const CARD_ORDER = new Map<string, number>(
  SUIT_SLUGS.flatMap((suit) =>
    RANK_SLUGS.map((rank) => `${rank}-of-${suit}`),
  ).map((slug, index): [string, number] => [slug, index]),
);

export function parseIsoCalendarDate(isoDate: string): IsoCalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || month < 1 || month > 12) return null;

  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [
    31,
    leapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  if (day < 1 || day > daysInMonth[month - 1]) return null;

  return { year, month, day };
}

export function birthdayWorkerPathFromIsoDate(isoDate: string): string | null {
  const parsed = parseIsoCalendarDate(isoDate);
  if (!parsed) return null;

  return `/born-on/${MONTH_SLUGS[parsed.month - 1]}-${parsed.day}`;
}

export function compatibilityPairPath(
  firstSlug: string,
  secondSlug: string,
): string | null {
  const firstIndex = CARD_ORDER.get(firstSlug);
  const secondIndex = CARD_ORDER.get(secondSlug);
  if (firstIndex === undefined || secondIndex === undefined) return null;

  const [earlier, later] =
    firstIndex <= secondIndex
      ? [firstSlug, secondSlug]
      : [secondSlug, firstSlug];
  return `/compatibility/${earlier}-and-${later}`;
}
