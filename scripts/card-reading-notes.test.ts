import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import NOTES from "../lib/card-reading-notes.json";
import { readingNotesFor } from "../lib/card-reading-notes";
import { allCardSlugs } from "../lib/seo-cards";

const BANNED = ["fate", "meant to", "the universe", "predicts", "foretells"] as const;

const pageSource = readFileSync(
  join(import.meta.dir, "..", "app", "birth-card", "[slug]", "page.tsx"),
  "utf8",
);

const table = NOTES as Record<
  string,
  { reading: string; love: string; work: string; timing: string }
>;

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

test("every one of the 52 SEO card slugs has all four reading-note fields", () => {
  const slugs = allCardSlugs();
  expect(slugs).toHaveLength(52);
  expect(Object.keys(table).sort()).toEqual([...slugs].sort());

  for (const slug of slugs) {
    const notes = readingNotesFor(slug);
    expect(notes).not.toBeNull();
    expect(notes!.reading.trim().length).toBeGreaterThan(0);
    expect(notes!.love.trim().length).toBeGreaterThan(0);
    expect(notes!.work.trim().length).toBeGreaterThan(0);
    expect(notes!.timing.trim().length).toBeGreaterThan(0);
  }

  expect(readingNotesFor("joker")).toBeNull();
});

test("reading notes contain none of the banned words", () => {
  for (const [slug, notes] of Object.entries(table)) {
    for (const [field, text] of Object.entries(notes)) {
      const lower = text.toLowerCase();
      for (const banned of BANNED) {
        expect(lower.includes(banned), `${slug}.${field} contains "${banned}"`).toBe(false);
      }
    }
  }
});

test("no sentence appears in more than one card", () => {
  const owners = new Map<string, string>();
  for (const [slug, notes] of Object.entries(table)) {
    for (const [field, text] of Object.entries(notes)) {
      for (const sentence of sentences(text)) {
        const prior = owners.get(sentence);
        expect(
          prior,
          `duplicate sentence in ${slug}.${field} (also ${prior}): ${sentence}`,
        ).toBeUndefined();
        owners.set(sentence, `${slug}.${field}`);
      }
    }
  }
});

test("5-of-diamonds page renders the In love label", () => {
  expect(readingNotesFor("5-of-diamonds")).not.toBeNull();
  expect(pageSource).toContain("readingNotesFor");
  expect(pageSource).toContain(
    '<h3 className="mt-4 font-serif text-base text-bone">In love</h3>',
  );
  expect(pageSource).toContain("dedupeAgainstPrior(readingNotes.love");
});
