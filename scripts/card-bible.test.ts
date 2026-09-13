// Golden test for lib/card-bible.json, the one source of card copy for pages,
// bot prompts and the distribution packager. Pins the shape (53 entries, every
// field filled), keeps it in sync with the engine and The Shadow Deck, and
// holds the banned language and voice rules on the fields the packager reads.
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { expect, test } from "bun:test";

import {
  CARD_BIBLE_ALL_CODES,
  CARD_BIBLE_CODES,
  JOKER_CODE,
  cardBible,
  cardBibleAny,
  cardBibleBySlug,
  jokerBible,
  type CardBibleCore,
} from "../lib/card-bible";
import { shadowEntry } from "../lib/shadow-deck";
import READING_NOTES from "../lib/card-reading-notes.json";
import CARD_DESCRIPTIONS from "../lib/engine-data/card-descriptions.json";

// Copy of the banned-language gate in scripts/validate-public-truth.ts. That
// file asserts on import, so it cannot be imported here; the drift test below
// fails if the two stop matching.
const BANNED = /\bfate\b|\bdestiny will\b|\bmeant to\b|\bthe universe\b|\bpredicts\b|\bforetells\b/i;

// Fields the packager and the card pages render. The corpus fields quoted
// verbatim from Cass's manuscripts (worldview, prompts, coreShadow, inTheLight,
// analog) are not gated: they are source text, rewritten in their own pass.
const PUBLIC_FIELDS = [
  "name",
  "coreIdentity",
  "sweetSpot",
  "shadow",
  "cost",
  "watchFor",
] as const;

// The lines this file holds to the brand voice
// (~/cardblueprints-ops/plans/brand-voice-2026-09-13.md).
const VOICE_FIELDS = ["sweetSpot", "shadow", "cost", "watchFor"] as const;

// Predictions, the way ~/cardblueprints-ops/card-reading/lint_reading.py reads
// them. "You will not" and "you will never" describe a standing refusal, not a
// forecast, so they stay.
const PREDICTION = /\byou will\b(?! not\b| never\b| know\b)|\bwill happen\b|\bguarantee/i;

// The mystic and filler words the brand voice bans, checked on the two fields
// this task writes. The engine descriptions and the three-lens sentences get
// their own rewrite pass (brand-voice doc, rollout step 2). "Leverage" stays
// allowed: Cass's notes use it in the plain sense, not the business one.
const VOICE_BANNED =
  /\b(universe|energies|energy|vibration|manifest|destiny|fated|journey|sacred|divine|cosmos|framework|deterministic|practitioner|esoteric|utilize|optimal|genuinely|honestly|truly|really|ultimately|karmic debt|tarot)\b/i;

test("card bible: 53 entries, the 52 birth cards then the Joker", () => {
  expect(CARD_BIBLE_ALL_CODES).toHaveLength(53);
  expect(CARD_BIBLE_CODES).toHaveLength(52);
  expect(CARD_BIBLE_ALL_CODES[52]).toBe(JOKER_CODE);
  expect(CARD_BIBLE_CODES[0]).toBe("A♥");
  expect(CARD_BIBLE_CODES[51]).toBe("K♠");
  expect(cardBible(JOKER_CODE)).toBeNull();
  expect(jokerBible().slug).toBe("joker");
  expect(cardBibleBySlug("8-of-diamonds")!.code).toBe("8♦");
  expect(cardBibleBySlug("ace-of-spades")!.code).toBe("A♠");
  expect(cardBible("8♦")!.name).toBe("8 of Diamonds");
});

test("card bible: every entry carries every field", () => {
  for (const code of CARD_BIBLE_ALL_CODES) {
    const e = cardBibleAny(code) as CardBibleCore;
    expect(e.code).toBe(code);
    for (const field of ["name", "slug", "rank", "suit", "title", ...PUBLIC_FIELDS] as const) {
      expect(typeof e[field] === "string" && (e[field] as string).trim().length > 0).toBe(true);
    }
    for (const field of ["coreIdentity", "sweetSpot", "shadow", "cost", "watchFor"] as const) {
      expect(e[field].length).toBeGreaterThan(20);
    }
    expect(e.keywords).toHaveLength(4);
    for (const k of e.keywords) expect(k.trim().length).toBeGreaterThan(0);
    // Same-card people: Wikidata-checked, five at most, never invented here.
    expect(e.famous.length).toBeGreaterThan(0);
    expect(e.famous.length).toBeLessThanOrEqual(5);
    for (const p of e.famous) {
      expect(p.name.length).toBeGreaterThan(1);
      expect(p.born).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(p.knownFor.length).toBeGreaterThan(2);
      expect(p.wikipedia).toStartWith("https://en.wikipedia.org/wiki/");
    }
    // The Worker's pair library covers the 52 only, so the Joker has no pairs.
    expect(e.pairs).toHaveLength(code === JOKER_CODE ? 0 : 3);
    for (const p of e.pairs) {
      expect(p.pos.length).toBeGreaterThan(2);
      expect(p.name.length).toBeGreaterThan(2);
      expect(p.href).toStartWith("/compatibility/");
    }
  }
});

test("card bible: the 52 stay in sync with the engine, the Shadow Deck and the reading notes", () => {
  for (const code of CARD_BIBLE_CODES) {
    const e = cardBible(code)!;
    expect(e.title).toBe((CARD_DESCRIPTIONS as Record<string, { title: string }>)[code].title);
    expect(e.archetype).toBe(shadowEntry(code)!.archetype);
    expect(e.sweetSpot).toBe(e.lens.balanced);
    const reading = (READING_NOTES as Record<string, { reading: string }>)[e.slug].reading;
    expect(reading).toContain(e.cost.charAt(0).toLowerCase() + e.cost.slice(1));
    for (const field of ["lifeDirection", "coreShadow", "worldview", "inTheLight"] as const) {
      expect(e[field].length).toBeGreaterThan(20);
    }
    expect(e.gifts.length).toBeGreaterThan(0);
    expect(e.prompts).toHaveLength(3);
    expect(e.lens.under.length).toBeGreaterThan(10);
    expect(e.lens.over.length).toBeGreaterThan(10);
    expect(typeof e.surfaceTruth).toBe("string");
    for (const k of ["corePattern", "shadowExpression", "evolvedExpression", "relationships", "career", "lifeLesson", "practice"] as const) {
      expect(e.analog[k].length).toBeGreaterThan(5);
    }
    expect(e.analog.mantra ?? "x").not.toContain('"');
  }
  expect(cardBible("8♦")!.archetype).toBe("The Grinder");
  expect(cardBible("8♦")!.title).toBe("The Businessman");
  expect(cardBible("J♦")).not.toBeNull();
});

test("card bible: no banned language in the copy the packager reads", () => {
  const violations: string[] = [];
  for (const code of CARD_BIBLE_ALL_CODES) {
    const e = cardBibleAny(code) as CardBibleCore;
    for (const field of PUBLIC_FIELDS) {
      const match = BANNED.exec(e[field] as string);
      if (match) violations.push(`${code}.${field}: "${match[0]}"`);
    }
    for (const k of e.keywords) {
      const match = BANNED.exec(k);
      if (match) violations.push(`${code}.keywords: "${match[0]}"`);
    }
  }
  expect(violations).toEqual([]);
});

test("card bible: the banned list still matches scripts/validate-public-truth.ts", () => {
  const gate = readFileSync(join(import.meta.dir, "validate-public-truth.ts"), "utf8");
  expect(gate).toContain(BANNED.source);
});

test("card bible: authored lines keep the brand voice", () => {
  const problems: string[] = [];
  for (const code of CARD_BIBLE_ALL_CODES) {
    const e = cardBibleAny(code) as CardBibleCore;
    for (const field of VOICE_FIELDS) {
      const text = e[field] as string;
      const where = `${code}.${field}`;
      if (/[—–]/.test(text)) problems.push(`${where}: dash`);
      if (/\*|_{2}|^#|\n/.test(text)) problems.push(`${where}: markdown`);
      if (PREDICTION.test(text)) problems.push(`${where}: prediction`);
      if (/\b(the individual|the querent|the native|users)\b/i.test(text)) {
        problems.push(`${where}: third person`);
      }
    }
    for (const field of ["cost", "watchFor"] as const) {
      const match = VOICE_BANNED.exec(e[field] as string);
      if (match) problems.push(`${code}.${field}: banned word "${match[0]}"`);
    }
    // Second person across the entry, not sentence by sentence: a cost line can
    // be one clause with no pronoun in it.
    const authored = VOICE_FIELDS.map((f) => e[f] as string).join(" ");
    if (!/\byou\b|\byour\b/i.test(authored)) problems.push(`${code}: not second person`);
    if (!/^Watch /.test(e.watchFor)) problems.push(`${code}.watchFor: does not name what to watch`);
  }
  expect(problems).toEqual([]);
});

test("card bible: the file is what the generator produces", () => {
  const referenceDir =
    process.env.REFERENCE_DIR ?? join(homedir(), "cardblueprints-ops", "reference");
  if (!existsSync(join(referenceDir, "analog-algorithm-cards.json"))) return; // corpus not on this machine
  const check = Bun.spawnSync(["bun", join(import.meta.dir, "build-card-bible.ts"), "--check"], {
    cwd: join(import.meta.dir, ".."),
  });
  expect(new TextDecoder().decode(check.stderr) + new TextDecoder().decode(check.stdout)).toContain(
    "up to date",
  );
  expect(check.exitCode).toBe(0);
});
