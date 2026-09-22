import { expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import FaqPage from "@/app/faq/page";
import { SiteFooter } from "@/components/seo/SiteFooter";
import { SiteHeader } from "@/components/seo/SiteHeader";
import { buildApplicationSitemapEntries } from "@/lib/application-sitemap";
import {
  DEEP_DIVE_FULFILLMENT,
  ONE_QUESTION_TURNAROUND,
} from "@/lib/deep-dive";
import { buildFaqPageJsonLd, FAQ_PATH, faqItems } from "@/lib/faq";
import { PAGE_UPDATED_DATES } from "@/lib/page-dates";
import { SITE_URL } from "@/lib/site";

type JsonLd = Record<string, unknown>;

function jsonLdGraphs(markup: string): JsonLd[] {
  return Array.from(
    markup.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/g),
    (match) => JSON.parse(match[1]!) as JsonLd | JsonLd[],
  ).flatMap((value) => (Array.isArray(value) ? value : [value]));
}

function decodeHtml(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function visibleAnswers(markup: string): Map<string, string> {
  const pairs = new Map<string, string>();
  for (const match of markup.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3><p\b[^>]*>([\s\S]*?)<\/p>/g)) {
    pairs.set(decodeHtml(match[1] ?? ""), decodeHtml(match[2] ?? ""));
  }
  return pairs;
}

test("/faq renders every question and an FAQPage graph with the same answers", () => {
  const markup = renderToStaticMarkup(createElement(FaqPage));
  const items = faqItems();
  const graphs = jsonLdGraphs(markup);
  const faqGraphs = graphs.filter((graph) => graph["@type"] === "FAQPage");
  const faq = faqGraphs[0];
  const mainEntity = faq?.mainEntity as { name: string; acceptedAnswer: { text: string } }[];

  expect(items.length).toBeGreaterThanOrEqual(12);
  expect(faqGraphs).toHaveLength(1);
  expect(faq).toEqual(buildFaqPageJsonLd());
  expect(mainEntity).toHaveLength(items.length);
  expect(markup).toContain(">Cardology FAQ</h1>");
  expect(markup).toContain(`Updated September 22, 2026`);
  expect(markup).not.toContain("2 business days");
  expect(markup).toContain(ONE_QUESTION_TURNAROUND);
  expect(markup).toContain(DEEP_DIVE_FULFILLMENT);

  const answers = visibleAnswers(markup);
  expect(answers.size).toBe(items.length);
  for (const item of items) {
    expect(answers.get(item.question)).toBe(item.answer);
    const entity = mainEntity.find((entry) => entry.name === item.question);
    expect(entity?.acceptedAnswer.text).toBe(item.answer);
    for (const link of item.links) {
      expect(markup).toContain(`href="${link.href}"`);
    }
  }
});

test("footer and header link to /faq", () => {
  const footer = renderToStaticMarkup(createElement(SiteFooter));
  const header = renderToStaticMarkup(createElement(SiteHeader));

  expect(footer.match(/href="\/faq"/g)).toHaveLength(1);
  expect(footer).toContain(">FAQ<");
  expect(header.match(/href="\/faq"/g)).toHaveLength(2);
  expect(header).toContain(">FAQ<");
});

test("application sitemap lists /faq on its reviewed date", () => {
  const url = `${SITE_URL}${FAQ_PATH}`;
  const entry = buildApplicationSitemapEntries().find((row) => row.url === url);

  expect(entry?.lastModified).toBe(PAGE_UPDATED_DATES[FAQ_PATH]);
  expect(PAGE_UPDATED_DATES[FAQ_PATH]).toBe("2026-09-22");
});
