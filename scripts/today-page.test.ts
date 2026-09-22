import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const page = readFileSync(join(root, "app/today/page.tsx"), "utf8");
const client = readFileSync(join(root, "components/app/TodayClient.tsx"), "utf8");
const feature = readFileSync(join(root, "components/seo/AppFeaturePage.tsx"), "utf8");
const prompt = readFileSync(join(root, "components/profile/ProfilePrompt.tsx"), "utf8");

function quoted(source: string, name: string): string {
  const match = source.match(new RegExp(`const ${name} =\\n\\s+"([^"]+)"`));
  expect(match).toBeTruthy();
  return match![1];
}

test("/today title, H1, and meta name the fixed birth-card calendar", () => {
  const description = quoted(page, "description");
  const metaTitle = page.match(/title: "([^"]+)"/)?.[1];
  expect(metaTitle).toBe("Today's Cardology Calendar: Fixed Birth-Card Map");
  expect(metaTitle!.length).toBeLessThanOrEqual(60);
  expect(page).toContain('const title = "Today\'s Cardology Calendar"');
  expect(description.length).toBeLessThanOrEqual(160);
  expect(description).toContain("52 playing cards");
  expect(description).toContain("Same date → same card.");
  expect(description).toContain("Not tarot.");
  expect(description).toContain("A mirror, not a forecast.");
  expect(page).not.toMatch(/daily card reading/i);
  expect(page).not.toMatch(/tarot draw/i);
  expect(page).not.toContain("Deep Dive");
  expect(page).not.toContain("Blueprint");
  expect(page).not.toMatch(/\bfortune\b/i);
  expect(page).not.toMatch(/\bpredict/i);
  expect(page).toMatch(/^export const metadata\b/m);
  expect(page).toMatch(/^export default function TodayPage\b/m);
  expect(page).not.toMatch(/^export (?!const metadata\b|default function TodayPage\b)/m);
});

test("/today puts the free calculator above the fold and withholds the shared offer", () => {
  expect(page).toContain('note="Same date → same card."');
  expect(page).toContain('calculatorLabel="Free birth card calculator"');
  expect(page).toContain("showOffer={false}");
  expect(feature).toContain('href="/birth-card-calculator"');
  expect(feature).toContain("calculatorLabel = \"Find your birth card\"");
  expect(feature).toContain("showOffer = true");
  expect(feature).toContain("{showOffer ? <OfferCta");
  for (const route of ["self", "timing", "journal", "story", "bonds", "reading"]) {
    const src = readFileSync(join(root, "app", route, "page.tsx"), "utf8");
    expect(src).not.toContain("showOffer={false}");
  }
});

test("anonymous /today escapes to the calculator; the $13 line waits for a reading", () => {
  const gateStart = client.indexOf("ready && !profile");
  const gateEnd = client.indexOf("ready && profile && error");
  const gate = client.slice(gateStart, gateEnd);
  expect(gateStart).toBeGreaterThan(0);
  expect(gate).toContain('primaryHref="/birth-card-calculator"');
  expect(gate).toContain("Same date → same card.");
  expect(gate).toContain("52 playing cards");
  expect(gate).toContain("Not tarot.");
  expect(gate).not.toContain("DEEP_DIVE");
  expect(gate).not.toContain("$13");
  expect(gate).not.toContain("One Question");

  const personalized = client.slice(client.indexOf("function Today("));
  expect(personalized).toContain("DEEP_DIVE_PRODUCT_PATH");
  expect(personalized).toContain("DEEP_DIVE_PRICE_LABEL");
  expect(personalized).toContain("A mirror, not a forecast.");
  expect(personalized).not.toMatch(/<h1[\s>]/);
  expect(personalized).not.toContain("Deep Dive");
  expect(personalized).not.toContain("Blueprint");

  expect(prompt).toContain('primaryHref = "/onboarding"');
  expect(prompt).toContain('secondaryHref = "/birth-card-calculator"');
});
