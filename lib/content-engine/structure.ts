import { publicBirthCardCode } from "@/lib/birth-card-truth";
import { getCardSeo } from "@/lib/seo-cards";
import variables from "./variables.json";

export type PlanetName =
  | "Mercury"
  | "Venus"
  | "Mars"
  | "Jupiter"
  | "Saturn"
  | "Uranus"
  | "Neptune";

export type StructureDay = {
  day: number;
  date: string;
  week: number;
  planet: PlanetName;
  verbs: string[];
  weekMode: string;
  cardCode: string;
  cardLabel: string;
  cardSlug: string;
  pattern: string;
  material: string;
  sweetSpot: string;
  under: string;
  over: string;
};

const PLANETS = Object.keys(variables.planets) as PlanetName[];
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

/** Parse YYYY-MM-DD as a UTC calendar date (no local TZ drift). */
export function parseIsoDate(iso: string): { year: number; month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

export function addUtcDays(iso: string, offset: number): string {
  const parsed = parseIsoDate(iso);
  if (!parsed) throw new Error(`Invalid date: ${iso}`);
  const d = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day + offset));
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function cardForIso(iso: string) {
  const parsed = parseIsoDate(iso);
  if (!parsed) throw new Error(`Invalid date: ${iso}`);
  const code = publicBirthCardCode(parsed.month, parsed.day);
  const seo = code === "Joker" ? null : getCardSeo(code);
  const slug =
    code === "Joker"
      ? "joker"
      : seo?.slug ?? `${MONTH_SLUGS[parsed.month - 1]}-${parsed.day}`;
  const fromVars = (variables.cards as Record<string, { pattern: string; material: string }>)[
    slug
  ];
  return {
    code,
    label: code === "Joker" ? "The Joker" : seo?.label ?? code,
    slug,
    pattern: fromVars?.pattern ?? "wild",
    material: fromVars?.material ?? "edge",
    sweetSpot: seo?.sweetSpot ?? "",
    under: seo?.under ?? "",
    over: seo?.over ?? "",
  };
}

/**
 * Build the hidden daily structure for a content calendar.
 * Week mode rotates Mercury → Neptune by week index from the start date.
 */
export function buildCalendarStructure(
  startDate: string,
  dayCount: number,
): StructureDay[] {
  if (!parseIsoDate(startDate)) {
    throw new Error(`Invalid start date: ${startDate}`);
  }
  if (dayCount < 1 || dayCount > 366) {
    throw new Error(`dayCount out of range: ${dayCount}`);
  }

  const out: StructureDay[] = [];
  for (let i = 0; i < dayCount; i++) {
    const date = addUtcDays(startDate, i);
    const week = Math.floor(i / 7) + 1;
    const planet = PLANETS[Math.floor(i / 7) % PLANETS.length]!;
    const verbs = [...variables.planets[planet].verbs];
    const card = cardForIso(date);
    out.push({
      day: i + 1,
      date,
      week,
      planet,
      verbs,
      weekMode: `${planet}: ${verbs.join(", ")}`,
      cardCode: card.code,
      cardLabel: card.label,
      cardSlug: card.slug,
      pattern: card.pattern,
      material: card.material,
      sweetSpot: card.sweetSpot,
      under: card.under,
      over: card.over,
    });
  }
  return out;
}

export function buildSampleStructure(startDate: string): StructureDay[] {
  return buildCalendarStructure(startDate, 7);
}

export function buildPaidStructure(startDate: string): StructureDay[] {
  return buildCalendarStructure(startDate, 52);
}
