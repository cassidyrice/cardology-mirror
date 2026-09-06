import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import FAMOUS from "../lib/famous-birthdays.json";
import { publicBirthCardCode } from "../lib/birth-card-truth";
import { famousForCard, wikidataUrl } from "../lib/famous-birthdays";

const root = join(import.meta.dir, "..");
const read = (path: string) => readFileSync(join(root, path), "utf8");

const table = FAMOUS as Record<string, Array<{
  name: string;
  qid: string;
  born: string;
  known_for: string;
  wikipedia: string;
}>>;

test("every Famous people row has a Wikidata QID, day-precision DOB, and Wikipedia link", () => {
  const cards = Object.keys(table);
  expect(cards).toHaveLength(53);
  expect(cards).toContain("Joker");

  let people = 0;
  for (const [card, rows] of Object.entries(table)) {
    expect(rows.length, card).toBeGreaterThan(0);
    for (const row of rows) {
      people += 1;
      expect(row.qid, row.name).toMatch(/^Q\d+$/);
      expect(row.born, row.name).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(row.born, row.name).not.toMatch(/-00-00$/);
      const [year, month, day] = row.born.split("-").map(Number);
      expect(publicBirthCardCode(month, day), `${row.name} ${row.born}`).toBe(card);
      expect(row.wikipedia, row.name).toStartWith("https://en.wikipedia.org/wiki/");
      expect(row.name.length, row.qid).toBeGreaterThan(1);
      expect(row.known_for.length, row.name).toBeGreaterThan(1);
      expect(year).toBeGreaterThan(1000);
    }
  }
  expect(people).toBeGreaterThanOrEqual(200);
});

test("famousForCard exposes Ace of Hearts samples with QID cites", () => {
  const ace = famousForCard("A♥");
  const tiger = ace.find((row) => row.name === "Tiger Woods");
  expect(tiger?.qid).toBe("Q10993");
  expect(tiger?.born).toBe("1975-12-30");
  expect(wikidataUrl(tiger!.qid)).toBe("https://www.wikidata.org/wiki/Q10993");
});

test("birth-card meaning and Joker pages share the grounded Famous people block", () => {
  const meaning = read("app/birth-card/[slug]/page.tsx");
  const joker = read("app/birth-card/joker/page.tsx");
  const block = read("components/seo/FamousPeopleBlock.tsx");

  expect(meaning).toContain("FamousPeopleBlock");
  expect(meaning).toContain("famousForCard(card.code)");
  expect(joker).toContain("FamousPeopleBlock");
  expect(joker).toContain('famousForCard("Joker")');

  expect(block).toContain("calendar coordinate, not a forecast");
  expect(block).toContain("Wikidata CC0 (P569 day precision)");
  expect(block).toContain("Wikipedia CC BY-SA 4.0");
  expect(block).toContain('data-slot="sources"');
  expect(block).toContain("wikidataUrl(person.qid)");
  expect(block).not.toContain("destiny");
  expect(block).not.toContain("fortune");
  expect(block).not.toContain("predict");
});
