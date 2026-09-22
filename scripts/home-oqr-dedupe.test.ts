import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import Home, { metadata as homeMeta } from "@/app/page";
import OneQuestionReadingPage, {
  metadata as productMeta,
} from "@/app/products/one-question-reading/page";
import {
  DEEP_DIVE_PRICE_LABEL,
  DEEP_DIVE_PRODUCT_NAME,
  ONE_QUESTION_TURNAROUND,
} from "@/lib/deep-dive";

const home = readFileSync("app/page.tsx", "utf8");
const product = readFileSync("app/products/one-question-reading/page.tsx", "utf8");

const PRODUCT_PROOF = "The 8 of Diamonds in you wants proof before it moves";
const RETIRED_OFFER = /\bDeep Dive\b|\bBlueprint\b|\$19/;

test("home leads with a free calculator link and keeps the $13 reading beside it", () => {
  expect(home).toContain('href="/birth-card-calculator"');
  expect(home).toContain("Find your card free");
  expect(home).toContain("DEEP_DIVE_PRODUCT_PATH");
  expect(home).toContain("ONE_QUESTION_TURNAROUND");
  expect(home).toContain("A mirror, not a forecast.");
  expect(home.indexOf('href="/birth-card-calculator"')).toBeLessThan(
    home.indexOf("<LandingCalculator />"),
  );
  expect(home.indexOf("<LandingCalculator />")).toBeLessThan(
    home.indexOf('id="home-reading-title"'),
  );
  expect(home).not.toMatch(RETIRED_OFFER);

  const markup = renderToStaticMarkup(createElement(Home));
  const free = markup.indexOf('href="/birth-card-calculator"');
  const reading = markup.indexOf('href="/products/one-question-reading"');
  expect(free).toBeGreaterThan(-1);
  expect(reading).toBeGreaterThan(free);
  expect(markup).toContain("Find your card free");
  expect(markup).toContain(
    `${DEEP_DIVE_PRODUCT_NAME} · ${DEEP_DIVE_PRICE_LABEL} · ${ONE_QUESTION_TURNAROUND}`,
  );
  expect(markup).toContain("A mirror, not a forecast.");
  expect(markup).not.toMatch(RETIRED_OFFER);
});

test("home teases the sample and the product page owns the full proof", () => {
  expect(product).toContain(PRODUCT_PROOF);
  expect(product).toContain('id="sample"');
  expect(product).toContain("You're an 8 of Diamonds. Eights are power");
  expect(home).not.toContain(PRODUCT_PROOF);
  expect(home).not.toContain("Eights are power, mastery");
  expect(home).toContain("Read the full sample");
  expect(home).toContain("#sample");

  const homeMarkup = renderToStaticMarkup(createElement(Home));
  const productMarkup = renderToStaticMarkup(createElement(OneQuestionReadingPage));
  expect(homeMarkup).not.toContain(PRODUCT_PROOF);
  expect(productMarkup).toContain(PRODUCT_PROOF);
  expect(homeMarkup).toContain('href="/products/one-question-reading#sample"');
});

test("One Question Reading title, meta, and H1 name the $13 minute mirror", () => {
  expect(productMeta.title).toBe(
    `${DEEP_DIVE_PRODUCT_NAME} · ${DEEP_DIVE_PRICE_LABEL} · ${ONE_QUESTION_TURNAROUND}`,
  );
  expect(productMeta.description).toBe(
    `Cardology ${DEEP_DIVE_PRODUCT_NAME} for ${DEEP_DIVE_PRICE_LABEL}. One question, read from your birth card and this year, written within ${ONE_QUESTION_TURNAROUND}. A mirror, not a forecast.`,
  );
  expect(productMeta.description).not.toBe(homeMeta.description);
  expect(String(productMeta.description)).toMatch(/Cardology/);
  expect(String(productMeta.description)).toMatch(/one question/i);
  expect(String(productMeta.description)).toMatch(/\$13/);

  const markup = renderToStaticMarkup(createElement(OneQuestionReadingPage));
  const h1 = markup.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? "";
  const h1Text = h1.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  expect(h1Text).toContain(DEEP_DIVE_PRODUCT_NAME);
  expect(h1Text).toContain(DEEP_DIVE_PRICE_LABEL);
  expect(h1Text).toContain(ONE_QUESTION_TURNAROUND);
  expect(h1Text).toContain("a mirror, not a forecast");
});

test("product page links the calculator before the purchase CTA and stays off retired offers", () => {
  expect(product.indexOf("Don&rsquo;t know your card yet?")).toBeLessThan(
    product.indexOf("<DeepDiveCta"),
  );
  expect(product.indexOf('href="/birth-card-calculator"')).toBeLessThan(
    product.indexOf("<DeepDiveCta"),
  );
  expect(product).not.toMatch(RETIRED_OFFER);

  const markup = renderToStaticMarkup(createElement(OneQuestionReadingPage));
  const jsonLd = markup.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
  );
  expect(jsonLd?.[1]).toBeTruthy();
  const graphs = JSON.parse(jsonLd?.[1] ?? "[]") as Array<{
    "@type"?: string;
    name?: string;
    description?: string;
  }>;
  const productJson = graphs.find((graph) => graph["@type"] === "Product");
  expect(productJson?.name).toBe(DEEP_DIVE_PRODUCT_NAME);
  expect(`${productJson?.name} ${productJson?.description}`).not.toMatch(RETIRED_OFFER);
  expect(jsonLd?.[1]).not.toMatch(RETIRED_OFFER);

  const visible = markup.replace(jsonLd?.[0] ?? "", "");
  const main = visible.slice(visible.indexOf('id="main-content"'));
  expect(main).toContain("Don’t know your card yet?");
  expect(main.indexOf('href="/birth-card-calculator"')).toBeLessThan(
    main.indexOf("Ask your question — $13"),
  );
  expect(visible).not.toMatch(RETIRED_OFFER);
});
