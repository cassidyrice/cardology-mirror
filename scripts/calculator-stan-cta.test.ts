import { expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StanReadingCta } from "../components/seo/StanReadingCta";
import { READINGS_NAV } from "../lib/readings-nav";

test("calculator result CTA opens on-page question reading modal for $26 Timing Map and $39 Chemistry Check", () => {
  const html = renderToStaticMarkup(createElement(StanReadingCta));
  expect(html).toContain("$26");
  expect(html).toContain("$39");
  expect(html).toContain("Chemistry Check");
  expect(html).not.toMatch(/<h[1-6]/);
  expect(html).not.toContain("stan.store");
});

test("zero stan.store URLs remain anywhere in app, components, or lib", () => {
  expect(READINGS_NAV.map((r) => [r.id, r.price, r.href])).toEqual([
    ["timing-map", "$26", "/#timing-map"],
    ["chemistry-check", "$39", "/#chemistry-check"],
  ]);
  const files = ["app", "components", "lib"].flatMap((dir) =>
    readdirSync(dir, { recursive: true, encoding: "utf8" })
      .filter((f) => /\.(?:ts|tsx|mjs)$/.test(f) && !f.includes(".test."))
      .map((f) => `${dir}/${f}`),
  );
  const links = files.flatMap((f) => readFileSync(f, "utf8").match(/https:\/\/stan\.store\/[^"'`\s]*/g) ?? []);
  expect(links).toEqual([]);
});
