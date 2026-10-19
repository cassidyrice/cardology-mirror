/**
 * Free birthdate chart (lead magnet on the calculator + homepage result).
 * Pure data, client-safe: the chart is drawn in the visitor's browser and the
 * birthday never leaves the page. Only the email + tags go to Buttondown
 * (via /api/chart-signup, lib/chart-signup.ts).
 * Dec 31 is the Joker — never a silent King of Spades.
 */
import { calculateBirthCardFromIsoDate, birthCardSlug } from "@/lib/birth-card-calculator";
import { lifetimeKarma, isFixedKarmaCard } from "@/lib/karma-origin";
import { parseCard } from "@/lib/cards";
import { parseIsoCalendarDate } from "@/lib/worker-seo-routes";
import THREE_LENS from "@/lib/card-meanings.json";
import CARD_VOICE from "@/scripts/card-bible-voice.json";

export const BIRTHDATE_CHART_TAG = "birthdate-chart";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type Lens = { name: string; under: string; sweet_spot: string; over: string };
const LENSES = THREE_LENS as Record<string, Lens>;
const WATCH_FOR = (CARD_VOICE as { watchFor: Record<string, string> }).watchFor;

export type ChartCard = { code: string; label: string };

export type BirthdateChart = {
  /** "June 15" — month and day only; the card does not depend on the year. */
  dateLabel: string;
  isJoker: boolean;
  birth: ChartCard;
  /** Card slug for tags/filenames ("2-of-diamonds" | "joker"). */
  slug: string;
  ruling: ChartCard[];
  karma: { environment: ChartCard; displacement: ChartCard } | null;
  isFixed: boolean;
  strength: string;
  shadow: string;
  watchFor: string;
};

function cardOf(code: string): ChartCard {
  if (code === "Joker") return { code, label: "The Joker" };
  return { code, label: parseCard(code)?.label ?? code };
}

export function birthdateChartFromIsoDate(isoDate: string): BirthdateChart | null {
  const parsed = parseIsoCalendarDate(isoDate);
  if (!parsed) return null;
  const result = calculateBirthCardFromIsoDate(isoDate);
  if (!result) return null;
  const dateLabel = `${MONTHS[parsed.month - 1]} ${parsed.day}`;
  const isJoker = result.birthCard === "Joker";
  if (isJoker) {
    return {
      dateLabel,
      isJoker,
      birth: cardOf("Joker"),
      slug: "joker",
      ruling: [],
      karma: null,
      isFixed: false,
      strength: "December 31 sits outside the 52. No fixed card — the wild edge of the year.",
      shadow: "",
      watchFor: "",
    };
  }
  const slug = birthCardSlug(result.birthCard) ?? "";
  const k = lifetimeKarma(result.birthCard);
  const lens = LENSES[result.birthCard];
  return {
    dateLabel,
    isJoker,
    birth: cardOf(result.birthCard),
    slug,
    ruling: result.rulingCards.filter((c) => c && c !== "Joker").map(cardOf),
    karma: k ? { environment: cardOf(k.environment), displacement: cardOf(k.displacement) } : null,
    isFixed: isFixedKarmaCard(result.birthCard),
    strength: lens?.sweet_spot ?? "",
    shadow: lens?.under ?? "",
    watchFor: WATCH_FOR[slug] ?? "",
  };
}

/** Buttondown tags for a chart signup. Never the birthday. */
export function birthdateChartTags(chart: BirthdateChart, source: string): string[] {
  return [BIRTHDATE_CHART_TAG, source, `card-${chart.slug}`].filter(Boolean);
}

export function birthdateChartFilename(chart: BirthdateChart): string {
  return `card-blueprints-birthdate-chart-${chart.slug}.png`;
}
