import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import Home from "../app/page";
import CalculatorPage from "../app/birth-card-calculator/page";
import WhatIsCardology from "../app/what-is-cardology/page";
import BirthCardIndex from "../app/birth-card/page";
import BirthCardPage from "../app/birth-card/[slug]/page";
import JokerPage from "../app/birth-card/joker/page";
import PlayingCardSpreads from "../app/playing-card-spreads/page";
import OneQuestionReadingPage from "../app/products/one-question-reading/page";
import FaqPage from "../app/faq/page";
import CardologyForBeginnersPage from "../app/cardology-for-beginners/page";
import CompatibilityCalculatorPage from "../app/birth-card-compatibility-calculator/page";
import CompatibilityPage from "../app/cardology-compatibility/page";
import DestinyCardsPage from "../app/destiny-cards/page";
import { DeepDiveHostedCheckout } from "../components/checkout/DeepDiveHostedCheckout";
import { DeepDiveCta } from "../components/seo/DeepDiveCta";
import { SiteFooter } from "../components/seo/SiteFooter";
import { SiteHeader } from "../components/seo/SiteHeader";
import { DEEP_DIVE_PRODUCT_PATH, DEEP_DIVE_REVIEW_PATH } from "../lib/deep-dive";

const root = join(import.meta.dir, "..");

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

const SCOPED_SOURCES = [
  "app/page.tsx",
  "app/birth-card-calculator/page.tsx",
  "app/what-is-cardology/page.tsx",
  "app/birth-card/page.tsx",
  "app/birth-card/[slug]/page.tsx",
  "app/birth-card/joker/page.tsx",
  "app/playing-card-spreads/page.tsx",
  "app/products/one-question-reading/page.tsx",
  "app/faq/page.tsx",
  "app/cardology-for-beginners/page.tsx",
  "app/birth-card-compatibility-calculator/page.tsx",
  "app/cardology-compatibility/page.tsx",
  "app/destiny-cards/page.tsx",
  "components/seo/SiteHeader.tsx",
  "components/seo/SiteFooter.tsx",
  "components/seo/BirthdayChartTable.tsx",
  "components/seo/DeepDiveCta.tsx",
];

function decode(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

function anchorText(inner: string): string {
  return decode(inner.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function anchors(html: string): Array<{ href: string; path: string; text: string }> {
  const found: Array<{ href: string; path: string; text: string }> = [];
  const re = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    const hrefMatch = match[1].match(/\shref="([^"]*)"/i);
    if (!hrefMatch) continue;
    const href = decode(hrefMatch[1]);
    if (!href.startsWith("/") || href.startsWith("//")) continue;
    const path = href.split("#")[0]?.split("?")[0] || href;
    if (!path.startsWith("/")) continue;
    found.push({ href, path, text: anchorText(match[2]) });
  }
  return found;
}

function exactRedirects(): Map<string, string> {
  const map = new Map<string, string>();
  const middleware = read("middleware.ts");
  for (const pair of middleware.matchAll(/"(\/[^"]+)":\s*"(\/[^"]+)"/g)) {
    map.set(pair[1], pair[2]);
  }
  const nextConfig = read("next.config.mjs");
  for (const pair of nextConfig.matchAll(/source:\s*"(\/[^":]+)"[\s\S]*?destination:\s*"([^"]+)"/g)) {
    map.set(pair[1], pair[2]);
  }
  return map;
}

const SOLE_ANCHOR = /^(?:click here|read more)(?:\s*[→↗])?$/i;

async function scopedMarkup(): Promise<Array<{ name: string; html: string }>> {
  const eight = await BirthCardPage({ params: Promise.resolve({ slug: "8-of-diamonds" }) });
  const queen = await BirthCardPage({ params: Promise.resolve({ slug: "queen-of-hearts" }) });
  return [
    { name: "/", html: renderToStaticMarkup(createElement(Home)) },
    { name: "/birth-card-calculator", html: renderToStaticMarkup(createElement(CalculatorPage)) },
    { name: "/what-is-cardology", html: renderToStaticMarkup(createElement(WhatIsCardology)) },
    { name: "/birth-card", html: renderToStaticMarkup(createElement(BirthCardIndex)) },
    { name: "/birth-card/8-of-diamonds", html: renderToStaticMarkup(eight as ReactElement) },
    { name: "/birth-card/queen-of-hearts", html: renderToStaticMarkup(queen as ReactElement) },
    { name: "/birth-card/joker", html: renderToStaticMarkup(createElement(JokerPage)) },
    { name: "/playing-card-spreads", html: renderToStaticMarkup(createElement(PlayingCardSpreads)) },
    { name: "/products/one-question-reading", html: renderToStaticMarkup(createElement(OneQuestionReadingPage)) },
    { name: "/faq", html: renderToStaticMarkup(createElement(FaqPage)) },
    { name: "/cardology-for-beginners", html: renderToStaticMarkup(createElement(CardologyForBeginnersPage)) },
    { name: "/birth-card-compatibility-calculator", html: renderToStaticMarkup(createElement(CompatibilityCalculatorPage)) },
    { name: "/cardology-compatibility", html: renderToStaticMarkup(createElement(CompatibilityPage)) },
    { name: "/destiny-cards", html: renderToStaticMarkup(createElement(DestinyCardsPage)) },
  ];
}

test("scoped hubs do not use click here or read more as the whole anchor", async () => {
  for (const path of SCOPED_SOURCES) {
    const source = read(path);
    expect(source, path).not.toMatch(/>\s*click here\s*</i);
    expect(source, path).not.toMatch(/>\s*read more\s*</i);
  }

  for (const page of await scopedMarkup()) {
    for (const anchor of anchors(page.html)) {
      expect(anchor.text, `${page.name} → ${anchor.href}`).not.toMatch(SOLE_ANCHOR);
    }
  }
});

test("scoped hubs do not link at exact internal redirects", async () => {
  const redirects = exactRedirects();
  expect(redirects.get("/blog/what-cardology-is-and-is-not")).toBe("/what-is-cardology");

  for (const page of await scopedMarkup()) {
    for (const anchor of anchors(page.html)) {
      const destination = redirects.get(anchor.path);
      expect(destination, `${page.name} still links ${anchor.path} (${anchor.text})`).toBeUndefined();
    }
  }
});

test("identical anchor text on one scoped page points at one path", async () => {
  for (const page of await scopedMarkup()) {
    const byText = new Map<string, Set<string>>();
    for (const anchor of anchors(page.html)) {
      const key = anchor.text.toLowerCase();
      if (!key) continue;
      const paths = byText.get(key) ?? new Set<string>();
      paths.add(anchor.path);
      byText.set(key, paths);
    }
    for (const [text, paths] of byText) {
      expect(paths.size, `${page.name} “${text}” → ${[...paths].join(", ")}`).toBe(1);
    }
  }
});

test("money paths are real anchors, including the offer when no birthday is stored", () => {
  const header = renderToStaticMarkup(createElement(SiteHeader));
  const footer = renderToStaticMarkup(createElement(SiteFooter));
  for (const markup of [header, footer]) {
    expect(markup).toContain('href="/birth-card-calculator"');
    expect(markup).toContain('href="/what-is-cardology"');
    expect(markup).toContain(`href="${DEEP_DIVE_PRODUCT_PATH}"`);
    expect(markup).toContain('href="/faq"');
    expect(markup).not.toContain("router.push");
  }

  const offer = renderToStaticMarkup(
    createElement(DeepDiveCta, { placement: "birth-card-meaning-above-fold", source: "birth-card-meaning" }),
  );
  expect(offer).toContain(`href="${DEEP_DIVE_PRODUCT_PATH}"`);
  expect(offer).not.toContain("router.push");

  const product = read("app/products/one-question-reading/page.tsx");
  expect(product).toContain("href={DEEP_DIVE_REVIEW_PATH}");
});

test("post-birthday continue control is a real checkout anchor", () => {
  const hosted = read("components/checkout/DeepDiveHostedCheckout.tsx");
  expect(hosted).toContain("href={DEEP_DIVE_REVIEW_PATH}");
  expect(hosted).toContain("storeCheckoutBirthdate(birthdate)");
  expect(hosted).toContain("storeCheckoutContext");
  expect(hosted).not.toContain("router.push");
  expect(hosted).not.toContain("<button");
  expect(hosted).not.toMatch(/href=\{[^}]*birthdate/);
  expect(hosted).not.toContain("?birthdate");

  const direct = renderToStaticMarkup(
    createElement(DeepDiveHostedCheckout, {
      birthdate: "1991-02-17",
      source: "birth-card-calculator-result",
      submitLabel: "Ask your question — $13",
    }),
  );
  expect(direct).toContain(`href="${DEEP_DIVE_REVIEW_PATH}"`);
  expect(direct).not.toContain("<button");
  expect(direct).not.toContain("1991-02-17");
  expect(direct).not.toContain("router.push");
  expect(direct).toContain("Ask your question — $13");
  expect(direct).not.toContain("Deep Dive");
  expect(direct).not.toContain("Blueprint");

  const withBirthday = renderToStaticMarkup(
    createElement(DeepDiveCta, {
      placement: "home-reveal",
      source: "home-reveal",
      birthdate: "1991-02-17",
      cardLabel: "Queen of Hearts",
      cardSlug: "queen-of-hearts",
      showFulfillment: false,
    }),
  );
  expect(withBirthday).toContain(`href="${DEEP_DIVE_REVIEW_PATH}"`);
  expect(withBirthday).toContain("Ask your question as the Queen of Hearts — $13");
  expect(withBirthday).not.toContain("<button");
  expect(withBirthday).not.toContain("1991-02-17");
  expect(withBirthday).not.toContain("queen-of-hearts");
  expect(withBirthday).not.toContain("Deep Dive");
  expect(withBirthday).not.toContain("Blueprint");
});
