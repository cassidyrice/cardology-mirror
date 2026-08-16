import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { resolvePublicBirth } from "../lib/birth-card-truth";
import { parseCard } from "../lib/cards";
import { slugFor } from "../lib/seo-cards";

const SITE_URL = "https://cardblueprints.com";
const DATASET_VERSION = "2026-08-15";
const MONTHS = [
  ["January", "january", 31],
  ["February", "february", 29],
  ["March", "march", 31],
  ["April", "april", 30],
  ["May", "may", 31],
  ["June", "june", 30],
  ["July", "july", 31],
  ["August", "august", 31],
  ["September", "september", 30],
  ["October", "october", 31],
  ["November", "november", 30],
  ["December", "december", 31],
] as const;

export const BIRTHDAY_MAP_COLUMNS = [
  "month_day",
  "month",
  "day",
  "date_label",
  "date_slug",
  "card_code",
  "card_label",
  "rank",
  "suit",
  "solar_value",
  "card_slug",
  "canonical_card_url",
  "birthday_url",
  "record_type",
  "exceptional_day_rule",
  "claim_classification",
  "methodology_url",
  "dataset_version",
] as const;

type Column = (typeof BIRTHDAY_MAP_COLUMNS)[number];
export type BirthdayMapRow = Record<Column, string>;

export function buildBirthdayMapRows(): BirthdayMapRow[] {
  const rows: BirthdayMapRow[] = [];

  MONTHS.forEach(([monthName, monthSlug, days], monthIndex) => {
    const month = monthIndex + 1;
    for (let day = 1; day <= days; day += 1) {
      const dateSlug = `${monthSlug}-${day}`;
      const resolved = resolvePublicBirth(month, day);
      const parsed = resolved.kind === "card" ? parseCard(resolved.code) : null;
      const cardSlug = parsed ? slugFor(parsed.rank, parsed.suit) : "";

      rows.push({
        month_day: `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        month: String(month),
        day: String(day),
        date_label: `${monthName} ${day}`,
        date_slug: dateSlug,
        card_code: resolved.code,
        card_label: parsed?.label ?? "Joker boundary",
        rank: parsed?.rank ?? "",
        suit: parsed?.suit ?? "",
        solar_value: String(resolved.solarValue),
        card_slug: cardSlug,
        canonical_card_url: cardSlug ? `${SITE_URL}/birth-card/${cardSlug}` : "",
        birthday_url: `${SITE_URL}/born-on/${dateSlug}`,
        record_type: resolved.kind === "card" ? "standard_card" : "joker_boundary",
        exceptional_day_rule:
          month === 2 && day === 29
            ? "leap_day_maps_normally"
            : resolved.kind === "joker"
              ? "december_31_joker_boundary"
              : "",
        claim_classification: "deterministic_date_to_card_mapping",
        methodology_url: `${SITE_URL}/methodology`,
        dataset_version: DATASET_VERSION,
      });
    }
  });

  return rows;
}

function csvCell(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

export function renderBirthdayMapCsv(rows: BirthdayMapRow[]): string {
  const lines = [
    BIRTHDAY_MAP_COLUMNS.join(","),
    ...rows.map((row) => BIRTHDAY_MAP_COLUMNS.map((column) => csvCell(row[column])).join(",")),
  ];
  return `${lines.join("\n")}\n`;
}

export function writeBirthdayMapCsv(outputPath: string): void {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, renderBirthdayMapCsv(buildBirthdayMapRows()), "utf8");
}

if (import.meta.main) {
  const output = join(import.meta.dir, "..", "public", "data", "cardology-birthday-map.csv");
  writeBirthdayMapCsv(output);
  console.log(`Wrote ${buildBirthdayMapRows().length} rows to ${output}`);
}
