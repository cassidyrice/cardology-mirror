import { expect, test } from "bun:test";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import {
  SHARE_BANNED_WORDS,
  SHARE_LAYOUT,
  SHARE_LIFE_PATH_SEAT_COUNT,
  SHARE_TEMPLATE_PATHS,
  assertShareLabelSafe,
  birthShareLabel,
  compatShareLabel,
  isSilentKingOfSpades,
  labelContainsBannedWord,
  labelContainsPrice,
  shareIdentityFromCode,
} from "../lib/share-cards";

const root = join(import.meta.dir, "..");
const read = (path: string) => readFileSync(join(root, path), "utf8");

const birthCalc = read("components/seo/BirthCardCalculator.tsx");
const compatCalc = read("components/seo/CompatibilityCalculator.tsx");
const shareUi = read("components/share/ShareCardCanvas.tsx");
const exportSrc = read("lib/share-cards/export.ts");
const labelsSrc = read("lib/share-cards/labels.ts");
const drawSrc = read("lib/share-cards/draw.ts");

test("public share templates and layout are on disk for production", () => {
  expect(existsSync(join(root, "public/share-cards/01-birth-result-template.png"))).toBe(true);
  expect(existsSync(join(root, "public/share-cards/02-compat-duel-template.png"))).toBe(true);
  expect(existsSync(join(root, "public/share-cards/layout.json"))).toBe(true);
  expect(SHARE_TEMPLATE_PATHS.birthResult).toBe("/share-cards/01-birth-result-template.png");
  expect(SHARE_TEMPLATE_PATHS.compatDuel).toBe("/share-cards/02-compat-duel-template.png");
  expect(SHARE_LAYOUT.birthResult.canvas).toEqual({ w: 1080, h: 1920 });
  expect(SHARE_LAYOUT.compatDuel.cardSlots).toHaveLength(2);
  expect(SHARE_LIFE_PATH_SEAT_COUNT).toBe(7);
  expect(SHARE_LAYOUT.rules.noPriceOnImage).toBe(true);
});

test("birth calculator: Copy/Share appears after card reveal and before DeepDiveCta", () => {
  expect(birthCalc).toContain('from "@/components/share/ShareCardCanvas"');
  expect(birthCalc).toContain("<ShareBirthResultButton");
  expect(birthCalc).toContain('birthCard={result.birthCard}');
  const shareIdx = birthCalc.indexOf("<ShareBirthResultButton");
  const diveIdx = birthCalc.indexOf(
    'placement="birth-card-calculator-result"',
  );
  expect(shareIdx).toBeGreaterThan(0);
  expect(diveIdx).toBeGreaterThan(shareIdx);
  // Old link-only ShareCard stays unused in the calculator result funnel.
  expect(birthCalc).not.toMatch(/<ShareCard[\s/>]/);
});

test("compat calculator: duel share before DeepDiveCta; first birthday seats only", () => {
  expect(compatCalc).toContain("<ShareCompatDuelButton");
  expect(compatCalc).toContain("firstBirthCard={a.birthCard}");
  expect(compatCalc).toContain("secondBirthCard={b.birthCard}");
  expect(compatCalc).toContain(
    "firstLifePathSeatCodes={a.allCards.map((seat) => seat.card)}",
  );
  const shareIdx = compatCalc.indexOf("<ShareCompatDuelButton");
  const diveIdx = compatCalc.indexOf(
    'placement="compatibility-calculator-result"',
  );
  expect(shareIdx).toBeGreaterThan(0);
  expect(diveIdx).toBeGreaterThan(shareIdx);
  // Price stays on the CTA, never on the image export path.
  expect(exportSrc).not.toContain("Get Deep Dive");
  expect(drawSrc).not.toContain("Get Deep Dive");
  expect(labelsSrc).toContain("PRICE_PATTERN");
});

test("share labels are card-name only — banned words and price never appear", () => {
  expect(SHARE_BANNED_WORDS).toEqual(
    expect.arrayContaining([
      "cardology",
      "fate",
      "destiny",
      "fortune",
      "predict",
    ]),
  );

  const queen = shareIdentityFromCode("Q♦");
  expect(queen?.label).toBe("Queen of Diamonds");
  const birth = birthShareLabel(queen!);
  expect(assertShareLabelSafe(birth)).toBe("Queen of Diamonds");
  expect(labelContainsBannedWord(birth)).toBe(false);
  expect(labelContainsPrice(birth)).toBe(false);

  const ace = shareIdentityFromCode("A♥");
  const duel = compatShareLabel(queen!, ace!);
  expect(duel).toBe("Queen of Diamonds · Ace of Hearts");
  expect(labelContainsBannedWord(duel)).toBe(false);
  expect(labelContainsPrice(duel)).toBe(false);

  for (const word of ["cardology", "fate", "destiny", "fortune", "predict"]) {
    expect(labelContainsBannedWord(`My ${word} card`)).toBe(true);
  }
  expect(labelContainsPrice("Get Deep Dive $9")).toBe(true);
  expect(() => assertShareLabelSafe("cardology fate")).toThrow();
});

test("Joker: honest treatment, never silent king-of-spades", () => {
  const joker = shareIdentityFromCode("Joker");
  expect(joker).toEqual({
    kind: "joker",
    code: "Joker",
    label: "The Joker",
  });
  expect(birthShareLabel(joker!)).toBe("The Joker");
  expect(isSilentKingOfSpades("K♠", true)).toBe(true);
  expect(isSilentKingOfSpades("Joker", true)).toBe(false);

  expect(labelsSrc).toContain('code === "Joker"');
  expect(drawSrc).toContain('identity.kind === "joker"');
  expect(drawSrc).toContain("JOKER");
  expect(drawSrc).toContain("never a silent King of Spades");
  expect(exportSrc).toContain("Joker must not be remapped");
  expect(exportSrc).not.toMatch(/identity\.code\s*=\s*["']K/);
  expect(exportSrc).toContain("Joker has no duel share");
  expect(shareUi).toContain('firstBirthCard === "Joker"');
  expect(shareUi).toContain("Honest Joker");
  // Birth share still offers Copy/Share with honest Joker art.
  expect(shareUi).toContain("isJoker ? \"The Joker\"");
});

test("runtime is client canvas + static templates, not Imagen/API", () => {
  expect(exportSrc).toContain("createShareCanvas");
  expect(exportSrc).toContain("loadTemplateImage");
  expect(exportSrc).toContain("SHARE_TEMPLATE_PATHS");
  expect(exportSrc).not.toMatch(/imagen|openai|replicate|stability/i);
  expect(shareUi).toContain("renderBirthSharePng");
  expect(shareUi).toContain("renderCompatSharePng");
  expect(shareUi).toContain("sharePngFile");
});
