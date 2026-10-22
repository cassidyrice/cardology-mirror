import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");

const COPY_SCOPE = [
  "lib/card-meanings.json",
  "lib/engine-data/card-descriptions.json",
  "lib/products.ts",
  "lib/blueprint.ts",
  "components/seo/OfferCta.tsx",
  "components/seo/BirthCardCalculator.tsx",
  "app/birth-card-calculator/page.tsx",
  "components/blueprint/BlueprintReportView.tsx",
] as const;

const PROMPT_SCOPE = [
  "lib/interpretation-guidance.ts",
  "app/api/deepdive/route.ts",
  "app/api/storyarc/route.ts",
] as const;

// Anxiety style (2026-10-22) replaced the dry mirror: the prompts now ask for
// the blunt Co-Star register, but never for identity jokes or cheerleading.
const ANXIETY_STYLE = /anxiety style/i;
const IDENTITY_GUARD = /never bodies, identity, trauma/i;
const CHEERLEADING = /you've got this|trust the process|you deserve/i;

const GAG_PITCH =
  /gag gift|gag-framed|sendable gag|cursed birthday|take a joke|as a gag gift/i;

const WOO = /\bthe universe\b|\bmanifest\b|\bvibrations\b|\byour energy\b/i;

const LOCKED_ROAST =
  /pokémon cards|pokemon cards|hostage situation|martyrdom grows cancerous/i;

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

describe("anxiety-style voice lint", () => {
  test("customer-facing copy has no gag-gift, roast, or woo register", () => {
    const hits: string[] = [];
    for (const rel of COPY_SCOPE) {
      const text = read(rel);
      for (const re of [GAG_PITCH, WOO, LOCKED_ROAST]) {
        const m = text.match(re);
        if (m) hits.push(`${rel}: ${m[0]}`);
      }
    }
    expect(hits).toEqual([]);
  });

  test("LLM prompts ask for anxiety style with the identity guard", () => {
    const missing: string[] = [];
    for (const rel of PROMPT_SCOPE) {
      const text = read(rel);
      if (!ANXIETY_STYLE.test(text)) missing.push(`${rel}: no anxiety style`);
      if (!IDENTITY_GUARD.test(text)) missing.push(`${rel}: no identity guard`);
    }
    expect(missing).toEqual([]);
  });

  test("customer-facing copy has no self-help cheerleading", () => {
    const hits: string[] = [];
    for (const rel of COPY_SCOPE) {
      const m = read(rel).match(CHEERLEADING);
      if (m) hits.push(`${rel}: ${m[0]}`);
    }
    expect(hits).toEqual([]);
  });

  test("locked roast examples are gone from meanings", () => {
    expect(read("lib/card-meanings.json")).not.toMatch(LOCKED_ROAST);
  });
});
