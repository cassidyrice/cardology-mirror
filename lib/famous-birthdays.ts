import FAMOUS from "./famous-birthdays.json";

// Well-known people whose Wikidata P569 day matches the listed birthday.
// The card is the page path; the date must also map to that card. An entry
// is a calendar coordinate, not an interpretation.
export type FamousPerson = {
  name: string;
  qid: string;
  born: string; // ISO YYYY-MM-DD, Wikidata P569 precision 11
  known_for: string;
  wikipedia: string;
};

const TABLE = FAMOUS as Record<string, FamousPerson[]>;
const QID_RE = /^Q\d+$/;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function wikidataUrl(qid: string): string {
  return `https://www.wikidata.org/wiki/${qid}`;
}

export function famousForCard(code: string): FamousPerson[] {
  const list = TABLE[code];
  if (!Array.isArray(list)) return [];
  return [...list]
    .filter((row) => QID_RE.test(row.qid) && DAY_RE.test(row.born) && row.wikipedia && row.name)
    .sort((a, b) => a.born.localeCompare(b.born) || a.name.localeCompare(b.name));
}

export function famousBirthdayLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const month = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ][m - 1];
  return `${month} ${d}, ${y}`;
}
