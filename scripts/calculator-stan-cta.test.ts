import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { CALCULATOR_STAN_CTA_HREF } from "../components/seo/StanReadingCta";

test("calculator result CTA goes straight to the Chemistry Check with result_cta UTM tags", () => {
  expect(CALCULATOR_STAN_CTA_HREF).toBe(
    "https://stan.store/mycardblueprint/p/the-chemistry-check-6dqvxn8u?utm_source=cardblueprints&utm_medium=calculator&utm_campaign=result_cta",
  );
  const src = readFileSync("components/seo/StanReadingCta.tsx", "utf8");
  expect(src).toContain("Chemistry Check · $39");
  expect(src).not.toMatch(/<h[1-6]/);
});
