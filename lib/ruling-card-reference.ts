import { birthCardSlug, calculateBirthCard } from "@/lib/birth-card-calculator";
import { parseCard } from "@/lib/cards";

type ReferenceCard = {
  code: string;
  label: string;
  href: string;
};

export type RulingCardReferenceRow = {
  month: number;
  day: number;
  dateLabel: string;
  id: string;
  birthCard: ReferenceCard;
  rulingCards: ReferenceCard[];
};

export const RULING_CARD_MONTHS: string[] = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function referenceCard(code: string): ReferenceCard {
  if (code === "Joker") {
    return { code, label: "Joker", href: "/birth-card/joker" };
  }

  const card = parseCard(code);
  const slug = birthCardSlug(code);
  if (!card || !slug) {
    throw new Error(`Unknown card in ruling-card reference: ${code}`);
  }
  return { code, label: card.label, href: `/birth-card/${slug}` };
}

/** Every birthday under the same date-table conventions as the public calculator. */
export function buildRulingCardReference(): RulingCardReferenceRow[] {
  const rows: RulingCardReferenceRow[] = [];
  // A leap year includes February 29. UTC keeps the reference timezone-independent.
  const date = new Date(Date.UTC(2000, 0, 1));

  while (date.getUTCFullYear() === 2000) {
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const monthName = RULING_CARD_MONTHS[month - 1];
    const result = calculateBirthCard(month, day);
    if (!result || result.rulingCards.length === 0) {
      throw new Error(`Missing ruling-card reference data for ${monthName} ${day}`);
    }

    rows.push({
      month,
      day,
      dateLabel: `${monthName} ${day}`,
      id: `${monthName.toLowerCase()}-${day}`,
      birthCard: referenceCard(result.birthCard),
      rulingCards: result.rulingCards.map(referenceCard),
    });
    date.setUTCDate(date.getUTCDate() + 1);
  }

  return rows;
}

function csvField(value: string | number): string {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** UTF-8 BOM helps spreadsheet apps preserve readable text when opening the download. */
export function rulingCardReferenceCsv(
  rows: RulingCardReferenceRow[] = buildRulingCardReference(),
): string {
  const records: (string | number)[][] = [[
    "Date", "Month", "Day", "Birth card", "Primary ruling card",
    "Secondary ruling card", "Third ruling card", "Lookup convention",
  ]];

  for (const row of rows) {
    // Fail visibly if the lookup ever expands, rather than dropping a fourth card.
    if (row.rulingCards.length > 3) {
      throw new Error(`CSV needs another ruling-card column for ${row.dateLabel}`);
    }
    records.push([
      row.dateLabel,
      row.month,
      row.day,
      row.birthCard.label,
      ...[0, 1, 2].map((index) => row.rulingCards[index]?.label ?? ""),
      "Card Blueprints date-table lookup",
    ]);
  }

  return `\uFEFF${records.map((record) => record.map(csvField).join(",")).join("\r\n")}\r\n`;
}
