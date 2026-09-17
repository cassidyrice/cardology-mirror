import { describe, expect, test } from "bun:test";

import { GET, dynamic } from "../app/data/planetary-ruling-card-chart.csv/route";
import { calculateBirthCard } from "../lib/birth-card-calculator";
import { allCardSlugs } from "../lib/seo-cards";
import {
  buildRulingCardReference,
  RULING_CARD_MONTHS,
  rulingCardReferenceCsv,
} from "../lib/ruling-card-reference";

const rows = buildRulingCardReference();

// Parse quoted CSV fields too, so column validation catches escaping regressions.
function parseCsv(csv: string): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let quoted = false;
  const content = csv.replace(/^\uFEFF/, "");
  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    if (char === '"') {
      if (quoted && content[i + 1] === '"') {
        field += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      record.push(field);
      field = "";
    } else if ((char === "\r" || char === "\n") && !quoted) {
      if (char === "\r" && content[i + 1] === "\n") i += 1;
      records.push([...record, field]);
      record = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (quoted) throw new Error("Unclosed CSV quote");
  if (record.length || field) records.push([...record, field]);
  return records;
}

describe("planetary ruling card reference", () => {
  test("includes every valid birthday exactly once, in calendar order", () => {
    expect(RULING_CARD_MONTHS).toHaveLength(12);
    expect(rows).toHaveLength(366);
    expect(new Set(rows.map((row) => `${row.month}-${row.day}`)).size).toBe(366);
    expect(new Set(rows.map((row) => row.id)).size).toBe(366);

    const date = new Date(Date.UTC(2000, 0, 1));
    for (const row of rows) {
      expect([row.month, row.day]).toEqual([
        date.getUTCMonth() + 1,
        date.getUTCDate(),
      ]);
      expect(row.dateLabel).toBe(`${RULING_CARD_MONTHS[row.month - 1]} ${row.day}`);
      expect(row.id).toBe(`${RULING_CARD_MONTHS[row.month - 1].toLowerCase()}-${row.day}`);
      date.setUTCDate(date.getUTCDate() + 1);
    }
    expect(date.toISOString()).toBe("2001-01-01T00:00:00.000Z");
  });

  test("preserves exact calculator birth and ruling cards for all 366 days", () => {
    for (const row of rows) {
      const calculated = calculateBirthCard(row.month, row.day);
      expect(calculated, row.dateLabel).not.toBeNull();
      expect(row.birthCard.code, row.dateLabel).toBe(calculated!.birthCard);
      expect(row.rulingCards.map((card) => card.code), row.dateLabel).toEqual(
        calculated!.rulingCards,
      );
    }
  });

  test("keeps all multiple-card dates, including both three-card dates", () => {
    expect(rows.filter((row) => row.rulingCards.length > 1)).toHaveLength(47);
    expect(rows.filter((row) => row.rulingCards.length === 3).map((row) => row.id))
      .toEqual(["october-23", "october-24"]);
    expect(rows.find((row) => row.id === "october-23")!.rulingCards.map((card) => card.code))
      .toEqual(["8♦", "K♠", "5♣"]);
    expect(rows.find((row) => row.id === "october-24")!.rulingCards.map((card) => card.code))
      .toEqual(["9♥", "2♥", "2♦"]);
  });

  test.each([
    ["january-15", "Q♦", ["7♣"]],
    ["february-13", "Q♦", ["5♦"]],
    ["february-29", "9♣", ["2♦"]],
    ["december-31", "Joker", ["Joker"]],
  ] as const)("retains the date-table result for %s", (id, birthCard, rulingCards) => {
    const row = rows.find((candidate) => candidate.id === id)!;
    expect(row.birthCard.code).toBe(birthCard);
    expect(row.rulingCards.map((card) => card.code)).toEqual([...rulingCards]);
  });

  test("uses readable names and existing card-meaning destinations, including Joker", () => {
    const hrefs = new Set([
      ...allCardSlugs().map((slug) => `/birth-card/${slug}`),
      "/birth-card/joker",
    ]);
    for (const row of rows) {
      for (const card of [row.birthCard, ...row.rulingCards]) {
        expect(card.label).not.toMatch(/[♥♦♣♠]/);
        expect(hrefs.has(card.href), `${row.dateLabel}: ${card.href}`).toBe(true);
      }
    }
    expect(rows[14].birthCard.label).toBe("Queen of Diamonds");
    expect(rows[14].rulingCards[0].label).toBe("7 of Clubs");
    const joker = { code: "Joker", label: "Joker", href: "/birth-card/joker" };
    expect(rows.at(-1)!.birthCard).toEqual(joker);
    expect(rows.at(-1)!.rulingCards).toEqual([joker]);
  });
});

describe("ruling card CSV download", () => {
  test("contains 366 complete rows with three separate ruling-card columns", () => {
    const csv = rulingCardReferenceCsv();
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    const [header, ...records] = parseCsv(csv);
    expect(header).toEqual([
      "Date", "Month", "Day", "Birth card", "Primary ruling card",
      "Secondary ruling card", "Third ruling card", "Lookup convention",
    ]);
    expect(records).toHaveLength(366);
    for (const [index, record] of records.entries()) {
      const row = rows[index];
      expect(record, row.dateLabel).toHaveLength(header.length);
      expect(record).toEqual([
        row.dateLabel, String(row.month), String(row.day), row.birthCard.label,
        ...[0, 1, 2].map((rulingIndex) => row.rulingCards[rulingIndex]?.label ?? ""),
        "Card Blueprints date-table lookup",
      ]);
    }
    expect(csv).not.toMatch(/[♥♦♣♠]/);
  });

  test("quotes commas, quotes and line breaks without changing data or column count", () => {
    const sample = {
      ...rows[0],
      dateLabel: 'January 1, "quoted"\ncontinued',
    };
    const [header, record] = parseCsv(rulingCardReferenceCsv([sample]));
    expect(record).toHaveLength(header.length);
    expect(record[0]).toBe(sample.dateLabel);
  });

  test("serves a static named UTF-8 attachment with the exact shared CSV bytes", async () => {
    expect(dynamic).toBe("force-static");
    const response = GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("Content-Disposition"))
      .toBe('attachment; filename="card-blueprints-planetary-ruling-card-chart.csv"');
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(bytes).toEqual(new TextEncoder().encode(rulingCardReferenceCsv()));
  });
});
