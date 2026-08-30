import { expect, test } from "bun:test";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

import {
  SHARE_BANNED_WORDS,
  SHARE_LAYOUT,
  SHARE_LIFE_PATH_SEAT_COUNT,
  SHARE_TEMPLATE_PATHS,
  lifePathSeatCenters,
  assertShareLabelSafe,
  birthShareLabel,
  compatShareLabel,
  isSilentKingOfSpades,
  labelContainsBannedWord,
  labelContainsPrice,
  shareIdentityFromCode,
  faceSlugFromIdentity,
  shareFacePath,
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
  expect(existsSync(join(root, "public/share-cards/samples/birth-8-of-diamonds.png"))).toBe(true);
  expect(
    existsSync(join(root, "public/share-cards/samples/compat-queen-diamonds-ace-hearts.png")),
  ).toBe(true);
  expect(SHARE_TEMPLATE_PATHS.birthResult).toBe("/share-cards/01-birth-result-template.png");
  expect(SHARE_TEMPLATE_PATHS.compatDuel).toBe("/share-cards/02-compat-duel-template.png");
  expect(SHARE_LAYOUT.birthResult.canvas).toEqual({ w: 1080, h: 1920 });
  expect(SHARE_LAYOUT.compatDuel.cardSlots).toHaveLength(2);
  expect(SHARE_LIFE_PATH_SEAT_COUNT).toBe(7);
  expect(SHARE_LAYOUT.rules.noPriceOnImage).toBe(true);
  const seats = SHARE_LAYOUT.compatDuel.lifePathBoard.seatCenters;
  expect(seats).toHaveLength(7);
  // Measured on 02-compat-duel-template.png — not a guessed smile-arc.
  expect(seats[0]).toEqual({ x: 203, y: 1352, r: 36 });
  expect(seats[3]).toEqual({ x: 541, y: 1440, r: 36 });
  expect(seats[6]).toEqual({ x: 879, y: 1352, r: 36 });
  // Mid seat sits ~70px below the old guessed centerY=1280 smile.
  expect(seats[3].y).toBeGreaterThan(1400);
});

test("Life Path seats are measured circle centers, not a guessed smile-arc", () => {
  const seats = SHARE_LAYOUT.compatDuel.lifePathBoard.seatCenters;
  expect(seats).toHaveLength(7);
  expect(SHARE_LAYOUT.compatDuel.lifePathBoard.seats).toBe(7);
  expect(seats[0]).toEqual({ x: 203, y: 1352, r: 36 });
  expect(seats[3]).toEqual({ x: 541, y: 1440, r: 36 });
  expect(seats[6]).toEqual({ x: 879, y: 1352, r: 36 });

  const centers = lifePathSeatCenters();
  expect(centers).toHaveLength(7);
  expect(centers.map((s) => s.y)).toEqual([1352, 1399, 1429, 1440, 1429, 1399, 1352]);
  // Guards against reintroducing the guessed arc (seat0 ≈ 180,1280).
  expect(centers[0].x).toBeGreaterThan(190);
  expect(centers[0].y).toBeGreaterThan(1320);
  expect(centers).toEqual(seats);
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
  expect(drawSrc).toContain("never a silent King of Spades");
  expect(drawSrc).toContain("/share-cards/faces/");
  expect(faceSlugFromIdentity(joker!)).toBe("joker");
  expect(shareFacePath(joker!)).toBe("/share-cards/faces/joker.png");
  expect(existsSync(join(root, "public/share-cards/faces/joker.png"))).toBe(true);
  // Joker face must not be the king-of-spades asset.
  expect(shareFacePath(joker!)).not.toContain("king-of-spades");
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
  expect(exportSrc).toContain("loadFaceImage");
  expect(exportSrc).toContain("SHARE_TEMPLATE_PATHS");
  expect(exportSrc).not.toMatch(/imagen|openai|replicate|stability/i);
  expect(shareUi).toContain("renderBirthSharePng");
  expect(shareUi).toContain("renderCompatSharePng");
  expect(shareUi).toContain("sharePngFile");
});

test("photo-real face PNGs slotted via drawImage (no canvas pips/monograms)", () => {
  // Runtime draws face PNGs — not Times pips / rank monograms
  expect(drawSrc).toContain("drawImage");
  expect(drawSrc).toContain("/share-cards/faces/");
  expect(drawSrc).toContain("loadFaceImage");
  expect(drawSrc).not.toContain("const PIPS");
  expect(drawSrc).not.toContain("COL_X");
  expect(exportSrc).toContain("loadFaceImage");
  expect(exportSrc).toContain("drawCardFace(ctx, layout.cardSlot, identity, face)");

  // Full 52 + joker face set on disk (seo-slug names)
  const facesDir = join(root, "public/share-cards/faces");
  const pngs = readdirSync(facesDir).filter((f) => f.endsWith(".png"));
  expect(pngs.length).toBe(53);
  for (const slug of [
    "8-of-diamonds",
    "queen-of-diamonds",
    "ace-of-hearts",
    "jack-of-clubs",
    "king-of-spades",
    "joker",
  ]) {
    expect(existsSync(join(facesDir, `${slug}.png`))).toBe(true);
  }
  // Brand pins must NEVER be used as faces
  expect(drawSrc).not.toContain("/pins/");
  expect(exportSrc).not.toContain("/pins/");

  const queen = shareIdentityFromCode("Q♦")!;
  expect(faceSlugFromIdentity(queen)).toBe("queen-of-diamonds");
  expect(shareFacePath(queen)).toBe("/share-cards/faces/queen-of-diamonds.png");

  // Soft shadow / stock constants still present for clip underlay
  expect(drawSrc).toContain("#fffef9");
  expect(drawSrc).toContain("#2c2a28");

  // Generator brief: plain field, flat templates, paste face PNGs
  const gen = read("scripts/generate_share_card_templates.py");
  expect(gen).toContain("0xEB, 0xE7, 0xE0");
  expect(gen).not.toContain("soft_card_shadow");
  expect(gen).toContain("Almost flat field");
  expect(gen).not.toMatch(/draw_frame\(/);
  expect(gen).not.toMatch(/dashed_rect\(/);
  expect(gen).not.toContain("GOLD = ");
  expect(gen).toContain("faces/<seo-slug>.png");
  expect(gen).toContain("paste_rounded_face");
  expect(gen).not.toContain("PIPS:");
  // Quiet type in draw
  expect(drawSrc).toContain("#6a645c");
  expect(drawSrc).toMatch(/400 \$\{size\}px/);
});

test("lifePathSeatCenters returns measured template coords", () => {
  const centers = lifePathSeatCenters();
  expect(centers).toHaveLength(7);
  expect(centers.map((c) => c.y)).toEqual(
    SHARE_LAYOUT.compatDuel.lifePathBoard.seatCenters.map((c) => c.y),
  );
  // Guard against reintroducing the procedural smile-arc (seat0 was ~180,1280).
  expect(centers[0].x).toBeGreaterThan(190);
  expect(centers[0].y).toBeGreaterThan(1320);
});
