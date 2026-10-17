import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (p: string) => readFileSync(join(import.meta.dir, "..", p), "utf8");

test("calculator results show the two Stan Store readings, not the retired $19/$13 offers", () => {
  const calculator = read("components/seo/BirthCardCalculator.tsx");
  const result = calculator.slice(
    calculator.indexOf("function CalculatorNextStep"),
    calculator.indexOf("function BirthCardResultCard"),
  );
  expect(result).not.toContain("<YearAheadResultOffer");
  expect(result).not.toContain("<DeepDiveHostedCheckout");
  expect(result).toContain("Get a free preview by email");
  expect(calculator).toContain('<OfferColumns placement="calculator-result"');

  const reveal = read("components/seo/Reveal.tsx");
  expect(reveal).not.toContain("<YearAheadResultOffer");
  expect(reveal).not.toContain("Got one question? Ask it. $13.");
  expect(reveal).not.toContain("free preview");
  expect(read("components/seo/LandingCalculator.tsx")).toContain('<OfferColumns placement="home-reveal"');

  const readings = read("lib/readings.ts");
  expect(readings).toContain('STAN_STORE_URL = "https://stan.store/mycardblueprint"');
  expect(readings).not.toContain("stan.store/mycardblueprint/p/");
  for (const name of ['"The Card Blueprint Reading"', '"The Chemistry Check"']) expect(readings).toContain(name);
  for (const price of ['"$300"', '"$27"']) expect(readings).toContain(price);
  for (const retired of ["Timing Map", "Family Snapshot", '"$97"', '"$137"', '"$179"']) {
    expect(readings).not.toContain(retired);
  }

});

test("retired offer pages redirect home and new checkout sessions are refused", () => {
  for (const p of [
    "app/products/one-question-reading/page.tsx",
    "app/products/year-ahead/page.tsx",
    "app/products/card-blueprint-app/page.tsx",
    "app/products/blueprint-report/page.tsx",
    "app/checkout/[offer]/page.tsx",
  ]) {
    expect(read(p)).toContain('permanentRedirect("/birth-card-calculator")');
  }
  expect(read("app/checkout/[offer]/session/route.ts")).toContain("status: 410");
  expect(read("app/api/checkout/webhook/route.ts").length).toBeGreaterThan(0);
});
