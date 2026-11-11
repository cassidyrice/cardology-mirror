import { expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StanReadingCta } from "../components/seo/StanReadingCta";
import { READINGS_NAV } from "../lib/readings-nav";

test("calculator result CTA opens on-page drawer for the $99 Card Blueprint Reading", () => {
  const html = renderToStaticMarkup(createElement(StanReadingCta));
  expect(html).toContain("$99");
  expect(html).toContain("The Card Blueprint Reading");
  expect(html).toContain("Suggested Questions");
  expect(html).not.toMatch(/\$26|\$39/);
  expect(html).not.toMatch(/<h[1-6]/);
  expect(html).not.toContain("stan.store");
});

test("zero stan.store URLs remain anywhere in app, components, or lib", () => {
  expect(READINGS_NAV.map((r) => [r.id, r.price, r.href])).toEqual([
    ["card-blueprint-reading", "$99", "/#readings"],
  ]);
  const files = ["app", "components", "lib"].flatMap((dir) =>
    readdirSync(dir, { recursive: true, encoding: "utf8" })
      .filter((f) => /\.(?:ts|tsx|mjs)$/.test(f) && !f.includes(".test."))
      .map((f) => `${dir}/${f}`),
  );
  const links = files.flatMap((f) => readFileSync(f, "utf8").match(/https:\/\/stan\.store\/[^"'`\s]*/g) ?? []);
  expect(links).toEqual([]);
});
