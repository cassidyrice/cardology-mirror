import FAMOUS from "./famous-birthdays.json";

// Well-known people whose (Wikipedia-verified) birthday resolves to a card.
// The card is derived from the date by the same formula as the calculator,
// so an entry is a fact about the calendar, not an interpretation.
export type FamousPerson = {
  name: string;
  born: string; // ISO YYYY-MM-DD
  known_for: string;
  wikipedia: string;
};

const TABLE = FAMOUS as Record<string, FamousPerson[]>;

export function famousForCard(code: string): FamousPerson[] {
  const list = TABLE[code];
  if (!Array.isArray(list)) return [];
  return [...list].sort((a, b) => a.born.localeCompare(b.born));
}

export function famousBirthdayLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const month = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ][m - 1];
  return `${month} ${d}, ${y}`;
}
