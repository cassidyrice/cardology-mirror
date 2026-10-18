import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { CALCULATOR_STAN_CTA_HREF } from "../components/seo/StanReadingCta";

test("calculator result CTA links to the Stan store with result_cta UTM tags and no price", () => {
  expect(CALCULATOR_STAN_CTA_HREF).toBe(
    "https://stan.store/mycardblueprint?utm_source=cardblueprints&utm_medium=calculator&utm_campaign=result_cta",
  );
  const src = readFileSync("components/seo/StanReadingCta.tsx", "utf8");
  expect(src).toContain("Get your full reading");
  expect(src).not.toMatch(/\$\d/);
  expect(src).not.toMatch(/<h[1-6]/);
});
