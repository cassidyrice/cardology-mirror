import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");

const COPY_SCOPE = [
  "lib/card-meanings.json",
  "lib/engine-data/card-descriptions.json",
  "lib/elroy/copy-overrides.ts",
  "lib/products.ts",
  "app/products/personal-card-blueprint/page.tsx",
  "lib/blueprint.ts",
  "lib/blueprint-sample.ts",
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

const ROAST_INSTRUCTION =
  /smartass|screenshot-worthy|do not soften|mockery in service|roast the reader/i;

const GAG_PITCH =
  /gag gift|gag-framed|sendable gag|cursed birthday|take a joke|as a gag gift/i;

const WOO = /\bthe universe\b|\bmanifest\b|\bvibrations\b|\byour energy\b/i;

const LOCKED_ROAST =
  /pokémon cards|pokemon cards|hostage situation|martyrdom grows cancerous/i;

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

describe("dry-mirror voice lint", () => {
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

  test("LLM prompts do not instruct a roast register", () => {
    const hits: string[] = [];
    for (const rel of PROMPT_SCOPE) {
      const text = read(rel);
      const m = text.match(ROAST_INSTRUCTION);
      if (m) hits.push(`${rel}: ${m[0]}`);
    }
    expect(hits).toEqual([]);
  });

  test("locked roast examples are gone from meanings", () => {
    expect(read("lib/card-meanings.json")).not.toMatch(LOCKED_ROAST);
  });
});
