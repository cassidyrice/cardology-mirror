import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  BIRTHDAY_MAP_COLUMNS,
  buildBirthdayMapRows,
  renderBirthdayMapCsv,
} from "./generate-cardology-birthday-map";

const SITE = "https://cardblueprints.com";

test("birthday map covers all 366 month-day combinations exactly once", () => {
  const rows = buildBirthdayMapRows();
  expect(rows).toHaveLength(366);
  expect(new Set(rows.map((row) => row.month_day)).size).toBe(366);
  expect(rows[0]?.month_day).toBe("01-01");
  expect(rows.at(-1)?.month_day).toBe("12-31");
});

test("birthday map preserves leap day and Joker public truth", () => {
  const rows = buildBirthdayMapRows();
  const leap = rows.find((row) => row.month_day === "02-29");
  const joker = rows.find((row) => row.month_day === "12-31");

  expect(leap).toMatchObject({
    card_code: "9♣",
    card_label: "9 of Clubs",
    card_slug: "9-of-clubs",
    canonical_card_url: `${SITE}/birth-card/9-of-clubs`,
    record_type: "standard_card",
    exceptional_day_rule: "leap_day_maps_normally",
  });
  expect(joker).toMatchObject({
    card_code: "Joker",
    card_label: "Joker boundary",
    card_slug: "",
    canonical_card_url: "",
    solar_value: "0",
    record_type: "joker_boundary",
    exceptional_day_rule: "december_31_joker_boundary",
  });
});

test("every standard row has auditable canonical URLs and deterministic claim label", () => {
  for (const row of buildBirthdayMapRows()) {
    expect(row.birthday_url).toBe(`${SITE}/born-on/${row.date_slug}`);
    expect(row.methodology_url).toBe(`${SITE}/methodology`);
    expect(row.claim_classification).toBe("deterministic_date_to_card_mapping");
    expect(row.dataset_version).toBe("2026-08-15");
    if (row.record_type === "standard_card") {
      expect(row.canonical_card_url).toBe(`${SITE}/birth-card/${row.card_slug}`);
      expect(row.rank).not.toBe("");
      expect(row.suit).not.toBe("");
    }
  }
});

test("CSV renders stable columns, UTF-8 glyphs, and exactly 367 lines", () => {
  const csv = renderBirthdayMapCsv(buildBirthdayMapRows());
  const lines = csv.trimEnd().split("\n");
  expect(lines).toHaveLength(367);
  expect(lines[0]).toBe(BIRTHDAY_MAP_COLUMNS.join(","));
  expect(csv).toContain("02-29,2,29,February 29,february-29,9♣");
  expect(csv).toContain("12-31,12,31,December 31,december-31,Joker");
  expect(csv.endsWith("\n")).toBe(true);
});

test("checked-in public CSV exactly matches the generator", () => {
  const generated = renderBirthdayMapCsv(buildBirthdayMapRows());
  const checkedIn = readFileSync(
    join(import.meta.dir, "..", "public", "data", "cardology-birthday-map.csv"),
    "utf8",
  );
  expect(checkedIn).toBe(generated);
});
