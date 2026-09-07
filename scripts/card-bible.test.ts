import { expect, test } from "bun:test";

import { CARD_BIBLE_CODES, cardBible, cardBibleBySlug } from "../lib/card-bible";
import { shadowEntry } from "../lib/shadow-deck";
import CARD_DESCRIPTIONS from "../lib/engine-data/card-descriptions.json";

test("card bible: 52 cards, every field filled, in sync with the engine and the Shadow Deck", () => {
  expect(CARD_BIBLE_CODES).toHaveLength(52);
  for (const code of CARD_BIBLE_CODES) {
    const e = cardBible(code)!;
    expect(e.code).toBe(code);
    expect(e.title).toBe((CARD_DESCRIPTIONS as Record<string, { title: string }>)[code].title);
    expect(e.archetype).toBe(shadowEntry(code)!.archetype);
    for (const field of ["coreIdentity", "shadow", "lifeDirection", "coreShadow", "worldview", "inTheLight", "surfaceTruth"] as const) {
      expect(typeof e[field] === "string" && (e[field] as string).length > 20).toBe(true);
    }
    expect(e.gifts.length).toBeGreaterThan(0);
    expect(e.prompts).toHaveLength(3);
    expect(e.keywords).toHaveLength(4);
    expect(e.lens.balanced.length).toBeGreaterThan(10);
    for (const k of ["corePattern", "shadowExpression", "evolvedExpression", "relationships", "career", "lifeLesson", "practice"] as const) {
      expect(e.analog[k].length).toBeGreaterThan(5);
    }
    expect(e.analog.mantra ?? "x").not.toContain('"');
  }
  expect(cardBible("8♦")!.archetype).toBe("The Grinder");
  expect(cardBible("8♦")!.title).toBe("The Businessman");
  expect(cardBibleBySlug("8-of-diamonds")!.code).toBe("8♦");
  expect(cardBibleBySlug("ace-of-spades")!.code).toBe("A♠");
  expect(cardBible("J♦")).not.toBeNull();
});
