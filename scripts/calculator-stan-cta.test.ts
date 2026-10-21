import { expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { CALCULATOR_STAN_CTA_HREF } from "../components/seo/StanReadingCta";
import { CHEMISTRY_CHECK_URL, TIMING_MAP_URL, FAMILY_SNAPSHOT_URL, READINGS_NAV } from "../lib/readings-nav";

test("calculator result CTA goes straight to the Chemistry Check with result_cta UTM tags", () => {
  expect(CALCULATOR_STAN_CTA_HREF).toBe(
    "https://stan.store/mycardblueprint/p/the-chemistry-check-6dqvxn8u?utm_source=cardblueprints&utm_medium=calculator&utm_campaign=result_cta",
  );
  const src = readFileSync("components/seo/StanReadingCta.tsx", "utf8");
  expect(src).toContain("Chemistry Check · $52");
  expect(src).not.toMatch(/<h[1-6]/);
});

test("homepage order link carries UTM tags, and no Stan link bypasses chemistryCheckUrl", () => {
  expect(READINGS_NAV[1].checkoutHref).toBe(
    "https://stan.store/mycardblueprint/p/the-chemistry-check-6dqvxn8u?utm_source=cardblueprints&utm_medium=homepage&utm_campaign=offer_card",
  );
  const files = ["app", "components", "lib"].flatMap((dir) =>
    readdirSync(dir, { recursive: true, encoding: "utf8" }).filter((f) => /\.tsx?$/.test(f) && !f.includes(".test.")).map((f) => `${dir}/${f}`),
  );
  const links = files.flatMap((f) => readFileSync(f, "utf8").match(/https:\/\/stan\.store\/[^"'`\s]*/g) ?? []);
  expect(links.length).toBeGreaterThan(0);
  for (const link of links) expect([CHEMISTRY_CHECK_URL, TIMING_MAP_URL, FAMILY_SNAPSHOT_URL]).toContain(link);
});
